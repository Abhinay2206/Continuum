from __future__ import annotations
import json
import asyncio
import logging
from typing import Union
from google import genai
from google.genai import types
from core.config import settings

logger = logging.getLogger(__name__)

_client = genai.Client(api_key=settings.gemini_api_key)


class GroqService:
    """
    Thin async wrapper around Gemini 2.5 Flash.

    Named ``GroqService`` for backward compatibility — every agent imports the
    ``groq_service`` singleton by this name. The underlying provider is Gemini.
    """

    def __init__(self):
        self.model = settings.chat_model

    async def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 1500,
        json_mode: bool = False,
    ) -> str:
        loop = asyncio.get_event_loop()

        def _call():
            config = types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=temperature,
                max_output_tokens=max_tokens,
                # Gemini 2.5 Flash is a thinking model: by default its internal
                # reasoning tokens are billed against max_output_tokens and can
                # consume the entire budget, leaving an empty/truncated answer.
                # These are deterministic extraction tasks — disable thinking so
                # the full budget goes to the JSON output (faster + cheaper).
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            )
            # Native JSON mode: Gemini guarantees parseable JSON, so we skip the
            # markdown-fence stripping dance and never waste output tokens on
            # ```json wrappers or prose.
            if json_mode:
                config.response_mime_type = "application/json"
            response = _client.models.generate_content(
                model=self.model,
                contents=user_prompt,
                config=config,
            )
            # Surface truncation: if the candidate stopped on MAX_TOKENS the JSON
            # is cut mid-string and will fail to parse — log it loudly so the
            # token budget can be tuned rather than silently degrading.
            try:
                cand = (response.candidates or [None])[0]
                finish = getattr(cand, "finish_reason", None)
                if finish is not None and str(getattr(finish, "name", finish)) not in ("STOP", "FinishReason.STOP"):
                    logger.warning(
                        "Gemini finish_reason=%s (max_tokens=%d) — output may be truncated.",
                        getattr(finish, "name", finish), max_tokens,
                    )
            except Exception:
                pass
            # response.text can be None when the model returns no candidate or
            # the output was truncated by the token cap — guard against it.
            return response.text or ""

        return await loop.run_in_executor(None, _call)

    async def complete_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
        max_tokens: int = 1500,
    ) -> Union[dict, list]:
        """Call Gemini in JSON mode and parse the response."""
        raw = await self.complete(
            system_prompt, user_prompt, temperature, max_tokens, json_mode=True
        )

        clean = raw.strip()
        # JSON mode normally returns clean JSON, but defensively strip fences.
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
            # Salvage: a response truncated by the token cap is an unterminated
            # array — recover every *complete* object so we keep the findings
            # the model did finish rather than discarding the whole batch.
            salvaged = self._salvage_json_array(clean)
            if salvaged:
                logger.warning(
                    "Gemini output truncated — salvaged %d complete finding(s).",
                    len(salvaged),
                )
                return salvaged
            logger.warning("Gemini JSON parse failed; returning raw fallback.")
            return {"raw": raw}

    @staticmethod
    def _salvage_json_array(text: str) -> list:
        """
        Extract all complete top-level ``{...}`` objects from a possibly
        truncated JSON array. Brace-depth aware and string/escape aware so
        braces inside string literals don't corrupt the count.
        """
        objects: list = []
        depth = 0
        start_idx = -1
        in_string = False
        escaped = False

        for i, ch in enumerate(text):
            if in_string:
                if escaped:
                    escaped = False
                elif ch == "\\":
                    escaped = True
                elif ch == '"':
                    in_string = False
                continue
            if ch == '"':
                in_string = True
            elif ch == "{":
                if depth == 0:
                    start_idx = i
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0 and start_idx != -1:
                    try:
                        objects.append(json.loads(text[start_idx : i + 1]))
                    except json.JSONDecodeError:
                        pass
                    start_idx = -1
        return objects


groq_service = GroqService()
