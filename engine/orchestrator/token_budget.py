"""
Token budget management for agent context windows.

Prevents token explosion by hard-capping the context string sent to Groq.
Uses a conservative chars-per-token ratio (4) that works well for mixed
code and natural-language content.
"""
from __future__ import annotations

CHARS_PER_TOKEN: int = 4

# Hard limits ─ leave room for the system prompt (~800 tokens) and the
# model's output (~2048 tokens) inside an ~8K context window.
MAX_CONTEXT_TOKENS: int = 2_000
MAX_CONTEXT_CHARS: int = MAX_CONTEXT_TOKENS * CHARS_PER_TOKEN  # 8_000


class TokenBudget:
    def __init__(self, max_chars: int = MAX_CONTEXT_CHARS) -> None:
        self.max_chars = max_chars

    def truncate(self, context: str) -> tuple[str, int]:
        """
        Return (truncated_context, estimated_token_count).

        Cuts at whole code block boundaries (``\\n\\n`` separators) so the LLM
        never receives a half-rendered code snippet.
        """
        if len(context) <= self.max_chars:
            return context, self.estimate_tokens(context)

        blocks = context.split("\n\n")
        kept: list[str] = []
        total = 0

        for block in blocks:
            block_len = len(block) + 2  # +2 for the \n\n separator
            if total + block_len > self.max_chars:
                break
            kept.append(block)
            total += block_len

        truncated = "\n\n".join(kept)
        return truncated, self.estimate_tokens(truncated)

    def estimate_tokens(self, text: str) -> int:
        return max(1, len(text) // CHARS_PER_TOKEN)

    def fits(self, text: str) -> bool:
        return len(text) <= self.max_chars


token_budget = TokenBudget()
