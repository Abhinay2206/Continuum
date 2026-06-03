"""
AI Orchestrator — v2 (token-efficient, retrieval-first)

Execution flow
──────────────
1. Intent Classification   — keyword-based, zero LLM calls
2. Cache lookup            — per-agent Redis cache (skips LLM for hit agents)
3. Shared context retrieval — ONE batch of parallel Qdrant searches for all
                              uncached agents; results deduplicated globally
4. Static pre-analysis     — regex secrets scan + manifest parsing on chunks
5. Parallel agent execution — asyncio.gather with per-agent timeout
6. Cache storage           — persist completed results for TTL period
7. Build output            — return orchestrator envelope to ActionEngine

Token savings vs. v1
─────────────────────
v1: each agent ran its own sequential retrieve_multi (5-8 queries × 5 chunks)
    + orchestrator spent ~800 tokens on an LLM agent-selection call.
v2: single parallel Qdrant batch for all agents, ≤10 chunks per agent
    (hard-capped by token budget), zero LLM calls before agent execution,
    caching eliminates repeat Groq calls for unchanged repos.
"""
from __future__ import annotations

import asyncio
import logging
import time

from agents.bug_agent.bug_agent import bug_agent
from agents.security_agent.security_agent import security_agent
from agents.architecture_agent.architecture_agent import architecture_agent
from agents.docs_agent.docs_agent import docs_agent
from agents.review_agent.review_agent import review_agent
from agents.dependency_agent.dependency_agent import dependency_agent
from orchestrator.intent_classifier import intent_classifier
from orchestrator.shared_retrieval import shared_retrieval
from orchestrator.token_budget import token_budget
from services.cache_service import cache_service
from services.static_analyzer import static_analyzer
from metrics import metrics

logger = logging.getLogger(__name__)

# ── Agent registry (add new agents here — orchestrator needs no other changes) ─

_REGISTRY: dict[str, object] = {
    "bug": bug_agent,
    "security": security_agent,
    "architecture": architecture_agent,
    "docs": docs_agent,
    "review": review_agent,
    "dependency": dependency_agent,
}

AGENT_TIMEOUT = 60  # seconds per agent


def register_agent(name: str, agent) -> None:
    """Plug-in registration — future agents call this at import time."""
    _REGISTRY[name] = agent


def get_agent(name: str):
    return _REGISTRY.get(name)


class Orchestrator:

    # ── Main entry point ──────────────────────────────────────────────────────

    async def run(self, repo_id: str, task: str) -> dict:
        """
        Orchestrate the minimal set of agents for *task* and return the raw
        results envelope consumed by ActionEngine.
        """
        t_total = time.monotonic()
        metrics.inc("orchestrator_runs")

        # ── Step 1: Intent classification (no LLM) ────────────────────────────
        intent = intent_classifier.classify(task)
        selected = intent.agents
        logger.info(
            "Orchestrator | intent=%s agents=%s repo=%s",
            intent.intent, selected, repo_id,
        )

        # ── Step 2: Cache lookup ──────────────────────────────────────────────
        cached: dict[str, dict] = {}
        uncached: list[str] = []

        for agent_name in selected:
            hit = await cache_service.get(repo_id, agent_name, task)
            if hit is not None:
                cached[agent_name] = hit
                metrics.inc("cache_hits")
                logger.debug("Cache hit | agent=%s repo=%s", agent_name, repo_id)
            else:
                uncached.append(agent_name)
                metrics.inc("cache_misses")

        if not uncached:
            logger.info("All results from cache for repo=%s", repo_id)
            return self._envelope(repo_id, task, selected, list(cached.values()))

        # ── Step 3: Shared context retrieval (parallel Qdrant) ────────────────
        with metrics.timer("retrieval_ms"):
            contexts = await shared_retrieval.retrieve_for_agents(
                repo_id,
                uncached,
                max_chunks_per_agent=10,
            )

        # ── Step 4: Static pre-analysis on retrieved chunks ───────────────────
        static_secrets: list[dict] = []
        static_dep_info: dict = {}

        if "security" in uncached or "dependency" in uncached:
            flat_chunks = static_analyzer.collect_all_chunks(contexts)
            if "security" in uncached:
                static_secrets = static_analyzer.scan_for_secrets(flat_chunks)
                if static_secrets:
                    logger.info(
                        "Static analysis found %d secret(s) in repo=%s",
                        len(static_secrets), repo_id,
                    )
            if "dependency" in uncached:
                static_dep_info = static_analyzer.extract_dependency_info(flat_chunks)

        # ── Step 5: Parallel agent execution ─────────────────────────────────
        fresh_results = await asyncio.gather(
            *[
                self._run_agent(
                    agent_name, repo_id, task, contexts,
                    static_secrets, static_dep_info,
                )
                for agent_name in uncached
            ],
            return_exceptions=True,
        )

        # ── Step 6: Cache completed results ───────────────────────────────────
        final_fresh: list[dict] = []
        for agent_name, result in zip(uncached, fresh_results):
            if isinstance(result, Exception):
                logger.error("Agent %s raised exception: %s", agent_name, result)
                final_fresh.append({
                    "agent": agent_name,
                    "status": "error",
                    "error": str(result),
                    "findings": [],
                })
            else:
                final_fresh.append(result)
                if result.get("status") == "completed":
                    await cache_service.set(repo_id, agent_name, task, result)

        metrics.record(
            "orchestrator_total_ms", (time.monotonic() - t_total) * 1000
        )

        all_results = list(cached.values()) + final_fresh
        return self._envelope(repo_id, task, selected, all_results)

    # ── Single-agent convenience (direct API calls) ───────────────────────────

    async def run_single_agent(
        self, agent_name: str, repo_id: str, task: str = ""
    ) -> dict:
        if agent_name not in _REGISTRY:
            return {
                "agent": agent_name,
                "status": "error",
                "error": f"Agent '{agent_name}' not found. Available: {list(_REGISTRY)}",
                "findings": [],
            }

        contexts = await shared_retrieval.retrieve_for_agents(repo_id, [agent_name])
        context, sources = contexts.get(agent_name, ("", []))
        context, _ = token_budget.truncate(context)

        agent = _REGISTRY[agent_name]
        return await agent._safe_run(
            repo_id=repo_id, task=task, context=context, sources=sources
        )

    # ── Internal helpers ──────────────────────────────────────────────────────

    async def _run_agent(
        self,
        agent_name: str,
        repo_id: str,
        task: str,
        contexts: dict,
        static_secrets: list[dict],
        static_dep_info: dict,
    ) -> dict:
        agent = _REGISTRY[agent_name]
        context, sources = contexts.get(agent_name, ("", []))

        # Apply token budget — hard cap before sending to Groq
        context, est_tokens = token_budget.truncate(context)
        metrics.inc(f"tokens_estimated_{agent_name}", est_tokens)

        # Build per-agent static hints
        hints: dict = {}
        if agent_name == "security" and static_secrets:
            hints["static_findings"] = static_secrets
        elif agent_name == "dependency" and static_dep_info.get("count", 0) > 0:
            hints["static_info"] = static_dep_info

        try:
            with metrics.timer(f"{agent_name}_agent_ms"):
                result = await asyncio.wait_for(
                    agent._safe_run(
                        repo_id=repo_id,
                        task=task,
                        context=context,
                        sources=sources,
                        static_hints=hints,
                    ),
                    timeout=AGENT_TIMEOUT,
                )
            return result
        except asyncio.TimeoutError:
            logger.warning(
                "Agent %s timed out (>%ds) for repo=%s", agent_name, AGENT_TIMEOUT, repo_id
            )
            return {
                "agent": agent_name,
                "status": "timeout",
                "findings": [],
                "error": f"Agent timed out after {AGENT_TIMEOUT}s",
            }

    @staticmethod
    def _envelope(
        repo_id: str,
        task: str,
        selected: list[str],
        results: list[dict],
    ) -> dict:
        return {
            "repo_id": repo_id,
            "task": task,
            "agents_selected": selected,
            "agent_results": results,
        }


orchestrator = Orchestrator()
