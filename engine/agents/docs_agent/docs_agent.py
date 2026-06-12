"""Documentation Agent — generates docs, README, and explanations."""
from __future__ import annotations

import logging

from agents.base_agent import BaseAgent, load_prompt
from core.config import settings

logger = logging.getLogger(__name__)

# Queries used only by the ad-hoc explain() and generate_readme() methods,
# which are called directly (not through the orchestrator).
_README_QUERIES = [
    "project setup installation run start command",
    "package.json requirements.txt dependencies",
    "environment variables configuration .env",
    "main entry API endpoints features",
]


class DocsAgent(BaseAgent):
    name = "docs"
    prompt_file = "docs_prompt.txt"

    # ── Orchestrator path ─────────────────────────────────────────────────────

    async def run(
        self,
        repo_id: str,
        task: str = "",
        context: str = "",
        sources: list[str] | None = None,
        static_hints: dict | None = None,
    ) -> dict:
        sources = sources or []

        if not context.strip():
            return {
                "agent": self.name,
                "status": "no_context",
                "findings": {},
                "sources": [],
            }

        user_prompt = self.build_user_prompt(
            context,
            task or "Generate comprehensive documentation for this repository.",
            static_hints,
        )

        raw = await self.analyze(user_prompt)
        return {
            "agent": self.name,
            "status": "completed",
            "findings": raw if isinstance(raw, dict) else {"content": raw},
            "sources": sources,
        }

    # ── Ad-hoc paths (called directly from the API, not via orchestrator) ─────

    async def generate_readme(self, repo_id: str) -> dict:
        """Generate a full README.md for the repository."""
        from orchestrator.shared_retrieval import shared_retrieval
        from orchestrator.token_budget import token_budget

        readme_prompt = load_prompt("readme_prompt.txt")
        context, sources = await shared_retrieval.retrieve_single(
            repo_id, _README_QUERIES, limit_per_query=6, max_chunks=12
        )
        context, _ = token_budget.truncate(context)

        user_prompt = self.build_user_prompt(
            context, "Generate a professional README.md for this repository."
        )
        raw = await self.groq.complete_json(readme_prompt, user_prompt, max_tokens=2000)

        return {
            "agent": self.name,
            "type": "readme",
            "status": "completed",
            "findings": raw if isinstance(raw, dict) else {"readme_content": str(raw)},
            "sources": sources,
        }

    async def explain(self, repo_id: str, topic: str) -> dict:
        """Explain a specific feature or flow in the repository."""
        from orchestrator.shared_retrieval import shared_retrieval
        from orchestrator.token_budget import token_budget

        explain_prompt = load_prompt("explain_prompt.txt")
        context, sources = await shared_retrieval.retrieve_single(
            repo_id, [topic], limit_per_query=10, max_chunks=10
        )
        context, _ = token_budget.truncate(context)

        user_prompt = self.build_user_prompt(context, f"Explain: {topic}")
        raw = await self.groq.complete_json(explain_prompt, user_prompt, max_tokens=settings.qa_max_tokens)

        return {
            "agent": self.name,
            "type": "explanation",
            "topic": topic,
            "status": "completed",
            "findings": raw if isinstance(raw, dict) else {"explanation": str(raw)},
            "sources": sources,
        }


docs_agent = DocsAgent()
