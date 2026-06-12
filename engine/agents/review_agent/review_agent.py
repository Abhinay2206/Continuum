"""Code Review Agent — evaluates maintainability, readability, best practices."""
from __future__ import annotations

import logging

from agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class ReviewAgent(BaseAgent):
    name = "review"
    prompt_file = "review_prompt.txt"

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
                "findings": [],
                "sources": [],
            }

        user_prompt = self.build_user_prompt(
            context,
            task or "Review the code for maintainability, readability, and engineering best practices.",
            static_hints,
        )

        raw = await self.analyze(user_prompt)
        findings = raw if isinstance(raw, list) else raw.get("findings", [raw])
        normalized = [
            f for f in findings
            if isinstance(f, dict) and ("issue" in f or "description" in f)
        ]

        return {
            "agent": self.name,
            "status": "completed",
            "findings": normalized,
            "sources": sources,
            "total": len(normalized),
        }


review_agent = ReviewAgent()
