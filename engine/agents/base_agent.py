"""
Base class for all specialized agents.

Interface change (v2)
──────────────────────
``run()`` now accepts pre-fetched ``context`` and ``sources`` from the
orchestrator's shared retrieval layer.  Agents no longer call Qdrant
themselves — that responsibility belongs exclusively to the orchestrator.

Backward compatibility
───────────────────────
``self.rag`` is kept so that DocsAgent's ad-hoc ``explain()`` and
``generate_readme()`` methods (which are called outside the orchestrator)
can still perform their own targeted retrieval.
"""
from __future__ import annotations

import json
import logging
import os
from abc import ABC, abstractmethod

from llm.groq_service import groq_service
from rag.retrieval import rag_retrieval
from core.config import settings

logger = logging.getLogger(__name__)

PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "..", "prompts")


def load_prompt(filename: str) -> str:
    path = os.path.join(PROMPTS_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


class BaseAgent(ABC):
    name: str = "base"
    prompt_file: str = ""

    def __init__(self) -> None:
        self.system_prompt = load_prompt(self.prompt_file)
        self.groq = groq_service
        # Per-agent output-token cap (Gemini 2.5 Flash budget). Conservative by
        # default; resolved from settings so limits live in one place.
        self.max_tokens: int = settings.agent_max_tokens.get(self.name, 1500)
        # Keep rag reference for ad-hoc methods (explain, readme) outside orchestrator
        self.rag = rag_retrieval

    async def analyze(self, user_prompt: str) -> object:
        """Run the agent's JSON analysis within its token budget."""
        return await self.groq.complete_json(
            self.system_prompt, user_prompt, max_tokens=self.max_tokens
        )

    # ── Primary interface (called by orchestrator) ────────────────────────────

    @abstractmethod
    async def run(
        self,
        repo_id: str,
        task: str = "",
        context: str = "",
        sources: list[str] | None = None,
        static_hints: dict | None = None,
    ) -> dict:
        """
        Execute analysis using *context* provided by the orchestrator.
        Agents must NOT call ``self.rag`` inside this method.
        """

    # ── Prompt builder ────────────────────────────────────────────────────────

    def build_user_prompt(
        self,
        context: str,
        task: str = "",
        static_hints: dict | None = None,
    ) -> str:
        parts: list[str] = []

        if task:
            parts.append(f"Task: {task}")

        if static_hints:
            for key, value in static_hints.items():
                label = key.replace("_", " ").title()
                serialised = (
                    json.dumps(value, indent=2)
                    if not isinstance(value, str)
                    else value
                )
                parts.append(f"Pre-identified {label}:\n{serialised}")

        if context:
            parts.append(f"Repository Code Context:\n{context}")

        return "\n\n".join(parts)

    # ── Error wrapper ─────────────────────────────────────────────────────────

    async def _safe_run(
        self,
        repo_id: str,
        task: str = "",
        context: str = "",
        sources: list[str] | None = None,
        static_hints: dict | None = None,
    ) -> dict:
        try:
            return await self.run(
                repo_id,
                task,
                context,
                sources or [],
                static_hints or {},
            )
        except Exception as exc:
            logger.exception("Agent %s failed: %s", self.name, exc)
            return {
                "agent": self.name,
                "status": "error",
                "error": str(exc),
                "findings": [],
            }
