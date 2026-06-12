"""
Finding post-processing — quality gate + cross-agent deduplication.

The agents return rich, structured JSON, but raw LLM output still needs three
guarantees before it reaches the UI:

1. Normalization   — different agents name the same concept differently
                     (``issue`` vs ``title`` vs ``package``; ``file`` vs
                     ``affected_area``). We attach canonical ``_title``,
                     ``_file``, ``_severity``, ``_confidence`` keys without
                     destroying the agent-specific fields the UI renders.

2. Quality gate    — reject findings that are evidence-free, reference no file,
                     fall below the confidence threshold, or use banned generic
                     language ("improve security", "add error handling"). These
                     are exactly the shallow, non-actionable outputs the redesign
                     is meant to eliminate.

3. Deduplication   — when two agents flag the same file+issue, keep the one from
                     the higher-priority domain and drop the duplicate so the
                     report never shows the same problem twice.
"""
from __future__ import annotations

import logging
import re

from core.config import settings

logger = logging.getLogger(__name__)

# Domain priority for cross-agent dedup — earlier wins when a duplicate appears.
_DOMAIN_PRIORITY = ["security", "bug", "dependency", "architecture", "review"]

# Banned generic phrases. A finding whose recommendation is *only* one of these
# (or trivially short) is shallow filler, not Staff-engineer signal.
_GENERIC_PHRASES = (
    "improve security",
    "add error handling",
    "consider refactoring",
    "improve code quality",
    "follow best practices",
    "improve performance",
    "add validation",
    "handle errors",
    "improve maintainability",
    "write better code",
    "add tests",
    "refactor this",
    "use best practices",
)

# Title field candidates, in priority order, across all agent schemas.
_TITLE_KEYS = ("issue", "title", "package", "description")
_FILE_KEYS = ("file", "affected_area", "package")


def _first(finding: dict, keys: tuple[str, ...]) -> str:
    for k in keys:
        v = finding.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return ""


# Textual confidence levels → numeric, in case a model ignores the "integer
# 0-100" instruction and returns "high"/"medium"/"low".
_TEXT_CONFIDENCE = {
    "very high": 95, "high": 90, "medium": 70, "moderate": 70,
    "low": 50, "very low": 30,
}


def _to_int(value, default: int = 0) -> int:
    try:
        return int(float(str(value)))
    except (TypeError, ValueError):
        return _TEXT_CONFIDENCE.get(str(value).strip().lower(), default)


def normalize(finding: dict, agent: str) -> dict:
    """Attach canonical keys without removing the agent-specific fields."""
    finding["_agent"] = agent
    finding["_title"] = _first(finding, _TITLE_KEYS)
    finding["_file"] = _first(finding, _FILE_KEYS)
    finding["_severity"] = str(finding.get("severity", "medium")).lower()
    finding["_confidence"] = _to_int(finding.get("confidence"), default=0)
    return finding


def _is_generic(text: str) -> bool:
    t = (text or "").strip().lower().rstrip(".")
    if not t:
        return True
    # Exact-match a banned phrase, or a recommendation too short to be specific.
    if t in _GENERIC_PHRASES:
        return True
    if len(t) < 25 and any(p in t for p in _GENERIC_PHRASES):
        return True
    return False


def is_quality(finding: dict) -> bool:
    """
    Quality gate. A finding passes only if it is concrete and actionable:
    references a file, carries evidence, clears the confidence bar, and gives a
    specific (non-generic) recommendation.
    """
    if finding.get("_confidence", 0) < settings.min_confidence_threshold:
        return False

    has_location = bool(finding.get("_file")) or bool(finding.get("line_hint"))
    has_evidence = bool(str(finding.get("evidence", "")).strip())
    if not has_location and not has_evidence:
        return False

    recommendation = str(finding.get("recommendation", "")).strip()
    if not recommendation or _is_generic(recommendation):
        return False

    return True


def process_agent_findings(findings: list, agent: str) -> list[dict]:
    """Normalize + quality-filter one agent's findings."""
    if not isinstance(findings, list):
        return []
    kept: list[dict] = []
    dropped = 0
    for f in findings:
        if not isinstance(f, dict):
            continue
        normalize(f, agent)
        # Static-analysis findings are deterministic ground truth — never gated.
        if f.get("detected_by") == "static_analysis" or is_quality(f):
            kept.append(f)
        else:
            dropped += 1
    if dropped:
        logger.info("Quality gate dropped %d shallow %s finding(s)", dropped, agent)
    return kept


def _dedup_key(finding: dict) -> tuple[str, str]:
    """Identity for dedup: normalized file + first few significant title words."""
    file_part = re.sub(r"[^a-z0-9/._-]", "", finding.get("_file", "").lower())
    title = finding.get("_title", "").lower()
    words = re.findall(r"[a-z0-9]+", title)[:4]
    return (file_part, " ".join(words))


def deduplicate(findings_by_domain: dict[str, list[dict]]) -> dict[str, list[dict]]:
    """
    Remove cross-agent duplicates. When the same (file, issue) appears in
    multiple domains, the higher-priority domain keeps it and lower-priority
    domains drop their copy.
    """
    seen: set[tuple[str, str]] = set()
    result: dict[str, list[dict]] = {d: [] for d in findings_by_domain}

    ordered_domains = [d for d in _DOMAIN_PRIORITY if d in findings_by_domain]
    ordered_domains += [d for d in findings_by_domain if d not in _DOMAIN_PRIORITY]

    removed = 0
    for domain in ordered_domains:
        for f in findings_by_domain[domain]:
            key = _dedup_key(f)
            # Empty key (no file, no title) can't be a meaningful duplicate.
            if key == ("", "") or key not in seen:
                seen.add(key)
                result[domain].append(f)
            else:
                removed += 1
    if removed:
        logger.info("Cross-agent dedup merged %d duplicate finding(s)", removed)
    return result


finding_processor = type(
    "FindingProcessor",
    (),
    {
        "process_agent_findings": staticmethod(process_agent_findings),
        "deduplicate": staticmethod(deduplicate),
        "normalize": staticmethod(normalize),
        "is_quality": staticmethod(is_quality),
    },
)()
