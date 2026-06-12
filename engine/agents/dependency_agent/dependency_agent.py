"""Dependency Agent — analyzes packages for vulnerabilities and bloat."""
from __future__ import annotations

import json
import logging

from agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class DependencyAgent(BaseAgent):
    name = "dependency"
    prompt_file = "dependency_prompt.txt"

    async def run(
        self,
        repo_id: str,
        task: str = "",
        context: str = "",
        sources: list[str] | None = None,
        static_hints: dict | None = None,
    ) -> dict:
        sources = sources or []
        static_hints = static_hints or {}

        # Metadata-only mode: the orchestrator strips code context once the
        # manifests are parsed, so proceed as long as we have either context or
        # parsed package metadata to reason about.
        if not context.strip() and not static_hints.get("static_info"):
            return {
                "agent": self.name,
                "status": "no_context",
                "findings": [],
                "sources": [],
            }

        # static_hints["static_info"] contains dependency manifest data already
        # parsed by StaticAnalyzer — the LLM receives a structured package list
        # instead of raw manifest text, which drastically cuts token usage.
        user_prompt = self.build_user_prompt(
            context,
            task or "Analyze all dependencies for vulnerabilities, outdated versions, and unnecessary packages.",
            static_hints,
        )

        raw = await self.analyze(user_prompt)
        findings = raw if isinstance(raw, list) else raw.get("findings", [raw])
        normalized = [
            f for f in findings
            if isinstance(f, dict) and ("package" in f or "description" in f)
        ]

        return {
            "agent": self.name,
            "status": "completed",
            "findings": normalized,
            "sources": sources,
            "total": len(normalized),
        }


dependency_agent = DependencyAgent()
