"""Security Agent — identifies vulnerabilities and security risks."""
from __future__ import annotations

import logging

from agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class SecurityAgent(BaseAgent):
    name = "security"
    prompt_file = "security_prompt.txt"

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

        # static_hints["static_findings"] contains secrets already detected by
        # regex — pre-populates the prompt so the LLM focuses on deeper issues
        # (auth patterns, injection vectors) rather than re-scanning for obvious ones.
        user_prompt = self.build_user_prompt(
            context,
            task or "Identify all security vulnerabilities, misconfigurations, and risks.",
            static_hints,
        )

        raw = await self.groq.complete_json(self.system_prompt, user_prompt)
        findings = raw if isinstance(raw, list) else raw.get("findings", [raw])

        # Merge static findings (already in static_hints) with LLM findings
        llm_findings = [
            f for f in findings
            if isinstance(f, dict) and ("issue" in f or "description" in f)
        ]
        static_findings = (static_hints or {}).get("static_findings", [])
        normalized = static_findings + llm_findings

        return {
            "agent": self.name,
            "status": "completed",
            "findings": normalized,
            "sources": sources,
            "total": len(normalized),
        }


security_agent = SecurityAgent()
