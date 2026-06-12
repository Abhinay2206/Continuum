"""
Shared retrieval layer — the single source of context for all agents.

Design contract
───────────────
* The orchestrator calls ``retrieve_for_agents`` once per request.
* All Qdrant searches for all selected agents run in parallel via
  ``asyncio.gather``.
* Result chunks are globally deduplicated by Qdrant point-ID; each agent
  receives only the chunks most relevant to its domain (top-N by score).
* Agents never call ``qdrant_service.search`` directly.

Token impact
────────────
Previous: 6 agents × 5-8 queries × 5-6 chunks = up to 240 sequential Qdrant
          searches per full analysis.
Now:      ~18 unique queries fired in parallel → 1 round-trip latency, shared
          dedup pool, ≤10 chunks per agent.
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from services.qdrant_service import qdrant_service
from services.embedding_service import embedding_service
from core.config import settings
from metrics import metrics

logger = logging.getLogger(__name__)

# ── Per-agent domain queries (trimmed to top 4-5, high-signal only) ───────────
AGENT_QUERIES: dict[str, list[str]] = {
    "bug": [
        "error handling exception null undefined reference check",
        "async await promise rejection race condition concurrent access",
        "memory leak resource cleanup connection close dispose",
        "database query N+1 loop performance bottleneck",
    ],
    "security": [
        "authentication authorization JWT token secret credentials API key",
        "SQL injection user input sanitization query parameter binding",
        "hardcoded password secret environment variable credentials",
        "CORS headers permission middleware authorization check",
    ],
    "architecture": [
        "controller service repository layer separation structure pattern",
        "dependency injection interface abstraction decoupling",
        "module folder organization domain boundary circular import",
        "scalability design pattern microservice separation of concerns",
    ],
    "review": [
        "function class complexity size naming convention readability",
        "code duplication repeated logic type annotation safety",
        "magic number constant test unit coverage spec",
    ],
    "dependency": [
        "package.json requirements.txt dependencies versions manifest",
        "import require library module version outdated security",
    ],
    "docs": [
        "main entry point application setup configuration start command",
        "API routes endpoints handlers request response",
        "authentication flow login register user session",
        "database models schema types structure",
    ],
}

MAX_CHUNKS_PER_AGENT = 10
LIMIT_PER_QUERY = 5


class SharedRetrieval:
    """
    Centralized context retrieval for the orchestration layer.

    retrieve_for_agents()
    ─────────────────────
    1. Collect all queries for every requested agent.
    2. Deduplicate queries that appear in multiple agents' lists.
    3. Fire all Qdrant searches in parallel (one asyncio.gather call).
    4. Pool + deduplicate hits by Qdrant point-ID; track which agents each
       hit is relevant to.
    5. For each agent, sort its chunk pool by score and return the top-N as a
       pre-formatted context string ready for LLM injection.
    """

    async def retrieve_for_agents(
        self,
        repo_id: str,
        agent_names: list[str],
        limit_per_query: int = LIMIT_PER_QUERY,
        max_chunks_per_agent: int = MAX_CHUNKS_PER_AGENT,
        chunk_limits: dict[str, int] | None = None,
    ) -> dict[str, tuple[str, list[str]]]:
        """
        Returns ``{agent_name: (context_string, source_files)}``.

        ``chunk_limits`` overrides the per-agent chunk cap so each agent receives
        only the context its domain needs (e.g. docs=5, architecture=10,
        dependency=3). Falls back to ``settings.agent_chunk_limits`` then to
        ``max_chunks_per_agent``.
        """
        chunk_limits = chunk_limits or settings.agent_chunk_limits
        # ── Build query → [agent] map ─────────────────────────────────────────
        query_to_agents: dict[str, list[str]] = {}
        ordered_queries: list[str] = []

        for agent in agent_names:
            for q in AGENT_QUERIES.get(agent, []):
                if q not in query_to_agents:
                    query_to_agents[q] = []
                    ordered_queries.append(q)
                if agent not in query_to_agents[q]:
                    query_to_agents[q].append(agent)

        if not ordered_queries:
            return {name: ("", []) for name in agent_names}

        # ── Parallel Qdrant searches ──────────────────────────────────────────
        t0 = time.monotonic()
        raw_results = await asyncio.gather(
            *[self._search(repo_id, q, limit_per_query) for q in ordered_queries],
            return_exceptions=True,
        )
        elapsed_ms = (time.monotonic() - t0) * 1000
        metrics.record("retrieval_ms", elapsed_ms)
        logger.debug(
            "SharedRetrieval: %d queries → %.0f ms (repo=%s)",
            len(ordered_queries), elapsed_ms, repo_id,
        )

        # ── Build per-agent chunk pools (dedup by point-ID) ───────────────────
        # Structure: {agent: {point_id: chunk_dict}}
        agent_pools: dict[str, dict[str, dict[str, Any]]] = {
            name: {} for name in agent_names
        }

        for query, results in zip(ordered_queries, raw_results):
            if isinstance(results, Exception):
                logger.warning("Search failed for query '%s...': %s", query[:40], results)
                continue

            for hit in results:
                point_id = str(hit.id)
                payload = hit.payload or {}
                score = hit.score

                for agent in query_to_agents[query]:
                    if agent not in agent_pools:
                        continue
                    existing = agent_pools[agent].get(point_id)
                    if existing is None or score > existing["score"]:
                        agent_pools[agent][point_id] = {
                            "chunk": payload.get("chunk", ""),
                            "file_path": payload.get("filePath", "unknown"),
                            "language": payload.get("language", ""),
                            "score": score,
                        }

        # ── Format context strings ────────────────────────────────────────────
        result: dict[str, tuple[str, list[str]]] = {}

        for agent in agent_names:
            cap = chunk_limits.get(agent, max_chunks_per_agent)
            top_chunks = sorted(
                agent_pools[agent].values(),
                key=lambda c: c["score"],
                reverse=True,
            )[:cap]

            blocks = [
                f"File: {c['file_path']}\n```{c['language']}\n{c['chunk']}\n```"
                for c in top_chunks
            ]
            sources = list(dict.fromkeys(c["file_path"] for c in top_chunks))
            result[agent] = ("\n\n".join(blocks), sources)

        return result

    # ── Single search helper ──────────────────────────────────────────────────

    async def _search(self, repo_id: str, query: str, limit: int):
        loop = asyncio.get_event_loop()
        vector = await loop.run_in_executor(
            None, embedding_service.generate_embedding, query
        )
        return await loop.run_in_executor(
            None, qdrant_service.search, repo_id, vector, limit
        )

    # ── Convenience: single-agent retrieval (used by docs explain/readme) ─────

    async def retrieve_single(
        self,
        repo_id: str,
        queries: list[str],
        limit_per_query: int = 5,
        max_chunks: int = 10,
    ) -> tuple[str, list[str]]:
        """
        Non-orchestrated retrieval for ad-hoc calls (explain, readme).
        Runs all provided queries in parallel and deduplicates.
        """
        raw_results = await asyncio.gather(
            *[self._search(repo_id, q, limit_per_query) for q in queries],
            return_exceptions=True,
        )

        seen: dict[str, dict] = {}
        for results in raw_results:
            if isinstance(results, Exception):
                continue
            for hit in results:
                pid = str(hit.id)
                if pid not in seen or hit.score > seen[pid]["score"]:
                    payload = hit.payload or {}
                    seen[pid] = {
                        "chunk": payload.get("chunk", ""),
                        "file_path": payload.get("filePath", "unknown"),
                        "language": payload.get("language", ""),
                        "score": hit.score,
                    }

        top = sorted(seen.values(), key=lambda c: c["score"], reverse=True)[:max_chunks]
        blocks = [
            f"File: {c['file_path']}\n```{c['language']}\n{c['chunk']}\n```"
            for c in top
        ]
        sources = list(dict.fromkeys(c["file_path"] for c in top))
        return "\n\n".join(blocks), sources


shared_retrieval = SharedRetrieval()
