from __future__ import annotations
import json
import asyncio
from typing import Union
from groq import Groq
from core.config import settings


class GroqService:
    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.chat_model

    async def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 4096,
    ) -> str:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            ),
        )
        return response.choices[0].message.content

    async def complete_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
        max_tokens: int = 4096,
    ) -> Union[dict, list]:
        """Call Groq and parse the response as JSON."""
        raw = await self.complete(system_prompt, user_prompt, temperature, max_tokens)
        # Strip markdown fences if the model wraps output
        clean = raw.strip()
        if clean.startswith("```"):
            lines = clean.split("\n")
            clean = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
        try:
            return json.loads(clean)
        except json.JSONDecodeError:
            # Attempt to salvage by finding the first [ or { and last ] or }
            start = min(
                (clean.find(c) for c in "[{" if c in clean),
                default=-1,
            )
            end_bracket = clean.rfind("]")
            end_brace = clean.rfind("}")
            end = max(end_bracket, end_brace)
            if start != -1 and end != -1:
                return json.loads(clean[start : end + 1])
            return {"raw": raw}


groq_service = GroqService()
