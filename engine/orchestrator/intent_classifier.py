"""
Keyword-based intent classifier — zero LLM calls.

Maps a free-text user task to the minimal set of agents required.
Replaces the previous pattern of calling Groq just to pick agents,
which burned ~500-1 000 tokens and added 1-3 s of latency per request.
"""
from __future__ import annotations

from typing import NamedTuple

# ── Agent keyword maps ────────────────────────────────────────────────────────
# Ordered from highest signal to lowest; partial-word matches are intentional
# (e.g. "depend" matches "dependency", "dependencies", "depends").

AGENT_KEYWORDS: dict[str, list[str]] = {
    "bug": [
        "bug", "error", "crash", "exception", "fail", "broken",
        "null", "undefined", "runtime", "traceback", "stacktrace",
        "fix issue", "not working", "wrong output",
    ],
    "security": [
        "security", "vuln", "exploit", "attack", "hack",
        "injection", "xss", "csrf", "sqli", "auth",
        "password", "secret", "credential", "token exposure",
        "insecure", "unsafe", "breach",
    ],
    "architecture": [
        "architect", "structure", "design", "pattern", "layer",
        "coupling", "solid", "module", "organization", "separation",
        "service boundary", "domain", "scalab",
    ],
    "review": [
        "review", "quality", "clean", "refactor", "lint",
        "maintainab", "readable", "best practice", "improve code",
        "code smell", "technical debt",
    ],
    "dependency": [
        "depend", "package", "library", "npm", "pip",
        "outdated", "version", "import", "cargo", "maven",
        "gradle", "pypi", "crates",
    ],
    "docs": [
        "explain", "document", "readme", "how does", "what is",
        "describe", "overview", "understand", "guide", "tutorial",
        "how do", "what does", "tell me about",
    ],
}

# Tasks that should trigger every health-relevant agent
FULL_ANALYSIS_PHRASES: list[str] = [
    "full analysis", "analyze everything", "complete scan",
    "all agents", "health scan", "health check",
    "repository analysis", "analyze repo", "scan repo",
    "full scan", "analyze repository",
]

# Agents included in a "full health" run (docs excluded — not a health metric)
HEALTH_AGENTS: list[str] = ["bug", "security", "architecture", "review", "dependency"]
ALL_AGENTS: list[str] = ["bug", "security", "architecture", "review", "dependency", "docs"]


class IntentResult(NamedTuple):
    intent: str            # primary intent label (best matching agent or "full_analysis")
    agents: list[str]      # ordered list of agents to execute
    is_full_analysis: bool


class IntentClassifier:
    def classify(self, task: str) -> IntentResult:
        """
        Classify *task* into an intent and a list of agents to run.
        No network call; runs in O(n·k) string operations.
        """
        task_lower = task.lower().strip()

        # 1. Full-analysis shortcut
        for phrase in FULL_ANALYSIS_PHRASES:
            if phrase in task_lower:
                return IntentResult("full_analysis", HEALTH_AGENTS, True)

        # 2. Score each agent by keyword hits
        scores: dict[str, int] = {}
        for agent, keywords in AGENT_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in task_lower)
            if score > 0:
                scores[agent] = score

        # 3. No clear signal → default to full health scan
        if not scores:
            return IntentResult("full_analysis", HEALTH_AGENTS, True)

        selected = sorted(scores, key=lambda a: scores[a], reverse=True)

        # 4. Domain-coupling rules (avoid redundant retrieval gaps)
        #    Security findings almost always benefit from dependency context
        if "security" in selected and "dependency" not in selected:
            selected.append("dependency")

        primary_intent = selected[0]
        return IntentResult(primary_intent, selected, False)


intent_classifier = IntentClassifier()
