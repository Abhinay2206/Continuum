"""Architecture Agent — evaluates structural design and patterns."""
from __future__ import annotations

import logging

from agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class ArchitectureAgent(BaseAgent):
    name = "architecture"
    prompt_file = "architecture_prompt.txt"

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
            task or "Evaluate the architectural quality, layer separation, and design patterns used.",
            static_hints,
        )

        raw = await self.analyze(user_prompt)

        # Support both old (array) and new (object with findings + topology) formats
        if isinstance(raw, list):
            findings_raw = raw
            topology = {"nodes": [], "edges": []}
        else:
            findings_raw = raw.get("findings", [])
            if not isinstance(findings_raw, list):
                findings_raw = [findings_raw] if findings_raw else []
            topology = raw.get("topology", {"nodes": [], "edges": []})
            if not isinstance(topology, dict):
                topology = {"nodes": [], "edges": []}

        normalized = [
            f for f in findings_raw
            if isinstance(f, dict) and ("issue" in f or "description" in f)
        ]

        return {
            "agent": self.name,
            "status": "completed",
            "findings": normalized,
            "topology": topology,
            "sources": sources,
            "total": len(normalized),
        }


architecture_agent = ArchitectureAgent()
