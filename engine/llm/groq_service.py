from __future__ import annotations
import json
import asyncio
import logging
from typing import Union
from groq import Groq, RateLimitError
from core.config import settings

logger = logging.getLogger(__name__)

# Seconds to wait after each consecutive 429 before retrying
_RETRY_DELAYS = (4, 10, 20)


class GroqService:
    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.chat_model
        # Lazily created so the semaphore binds to the running event loop,
        # not the import-time loop (important for Python 3.9).
        self._semaphore: asyncio.Semaphore | None = None

    def _sem(self) -> asyncio.Semaphore:
        """Return (or create) the single-concurrency Groq semaphore."""
        if self._semaphore is None:
            self._semaphore = asyncio.Semaphore(1)
        return self._semaphore

    async def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 1500,
    ) -> str:
        """
        Call Groq with automatic retry on 429 rate-limit errors.

        A module-level semaphore(1) serialises all Groq calls so we never
        fire multiple requests at the same time and stay well inside the
        30 000 TPM cap on the on-demand tier.
        """
        loop = asyncio.get_event_loop()
        sem = self._sem()

        for attempt in range(len(_RETRY_DELAYS) + 1):
            async with sem:
                try:
                    response = await loop.run_in_executor(
                        None,
                        lambda: self.client.chat.completions.create(
                            model=self.model,
                            messages=[
                                {"role": "system", "content": system_prompt},
                                {"role": "user",   "content": user_prompt},
                            ],
                            temperature=temperature,
                            max_tokens=max_tokens,
                        ),
                    )
                    return response.choices[0].message.content

                except RateLimitError as exc:
                    if attempt >= len(_RETRY_DELAYS):
                        logger.error("Groq rate limit — all retries exhausted.")
                        raise
                    delay = _RETRY_DELAYS[attempt]
                    logger.warning(
                        "Groq 429 rate-limit (attempt %d/%d) — sleeping %ds then retrying.",
                        attempt + 1, len(_RETRY_DELAYS) + 1, delay,
                    )
                    # Sleep while holding the semaphore so no other agent
                    # fires during the back-off window.
                    await asyncio.sleep(delay)

        raise RuntimeError("Groq complete: retry loop exhausted without raising")

    async def complete_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
        max_tokens: int = 1500,
    ) -> Union[dict, list]:
        """Call Groq and parse the response as JSON."""
        raw = await self.complete(system_prompt, user_prompt, temperature, max_tokens)

        clean = raw.strip()
        if clean.startswith("```"):
            lines = clean.split("\n")
            clean = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

        try:
            return json.loads(clean)
        except json.JSONDecodeError:
            start = min(
                (clean.find(c) for c in "[{" if c in clean),
                default=-1,
            )
            end = max(clean.rfind("]"), clean.rfind("}"))
            if start != -1 and end != -1:
                try:
                    return json.loads(clean[start : end + 1])
                except json.JSONDecodeError:
                    pass
            return {"raw": raw}


groq_service = GroqService()
