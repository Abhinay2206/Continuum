"""
Action Engine — aggregates multi-agent results into a unified report with
health scores, risk summaries, and prioritized action plans.
"""
from __future__ import annotations
import math
from typing import Any

from orchestrator.finding_processor import finding_processor


SEVERITY_WEIGHT = {
    "critical": 20,
    "high": 10,
    "medium": 4,
    "low": 1,
}

# Maximum penalty per agent domain before score floors at 0
MAX_PENALTY = 100


def _severity_penalty(findings: list[dict]) -> float:
    """Calculate total weighted penalty for a list of findings."""
    return sum(
        SEVERITY_WEIGHT.get(str(f.get("severity", "low")).lower(), 1)
        for f in findings
    )


def _score_from_penalty(penalty: float, base: int = 100) -> int:
    """Convert a raw penalty into a 0-100 score using exponential decay."""
    score = base * math.exp(-penalty / 40)
    return max(0, min(100, round(score)))


def _extract_findings(agent_results: list[dict], agent_name: str) -> list[dict]:
    for r in agent_results:
        if r.get("agent") == agent_name and r.get("status") == "completed":
            raw = r.get("findings", [])
            if isinstance(raw, list):
                return raw
    return []


def _extract_topology(agent_results: list[dict]) -> dict:
    for r in agent_results:
        if r.get("agent") == "architecture" and r.get("status") == "completed":
            t = r.get("topology", {})
            if isinstance(t, dict):
                return t
    return {"nodes": [], "edges": []}


def _safe_int(value) -> int | None:
    """Convert confidence to int, handling strings, floats, and None."""
    if value is None:
        return None
    try:
        return int(float(str(value)))
    except (TypeError, ValueError):
        return None


_SEV_RANK = {"critical": 0, "high": 1, "medium": 2, "low": 3}


def _action_sort_key(item: dict) -> tuple:
    """
    Sort key for action-plan items.
    Tuple: (priority, severity_rank, -confidence)
    All values are guaranteed ints — never raises regardless of LLM output types.
    """
    priority = item.get("priority", 9)
    sev = _SEV_RANK.get(str(item.get("severity", "")).lower(), 2)
    try:
        conf = -int(float(str(item["confidence"]))) if item.get("confidence") is not None else 0
    except Exception:
        conf = 0
    return (priority, sev, conf)


def _critical_count(findings: list[dict]) -> int:
    return sum(
        1 for f in findings
        if str(f.get("severity", "")).lower() in ("critical", "high")
    )


class ActionEngine:
    def aggregate(self, orchestrator_output: dict) -> dict:
        """
        Take the raw orchestrator output and produce the final unified report.
        """
        repo_id: str = orchestrator_output.get("repo_id", "unknown")
        task: str = orchestrator_output.get("task", "")
        agents_selected: list[str] = orchestrator_output.get("agents_selected", [])
        agent_results: list[dict] = orchestrator_output.get("agent_results", [])

        # --- Extract findings per domain ---
        topology = _extract_topology(agent_results)
        docs_findings = _extract_findings(agent_results, "docs")

        # Cross-agent deduplication: when multiple agents flag the same
        # file+issue, the higher-priority domain keeps it and the rest drop
        # their copy — so the report never shows one problem twice.
        deduped = finding_processor.deduplicate({
            "security": _extract_findings(agent_results, "security"),
            "bug": _extract_findings(agent_results, "bug"),
            "dependency": _extract_findings(agent_results, "dependency"),
            "architecture": _extract_findings(agent_results, "architecture"),
            "review": _extract_findings(agent_results, "review"),
        })
        bug_findings = deduped["bug"]
        security_findings = deduped["security"]
        architecture_findings = deduped["architecture"]
        review_findings = deduped["review"]
        dependency_findings = deduped["dependency"]

        # --- Calculate domain scores ---
        security_score = _score_from_penalty(_severity_penalty(security_findings) + _severity_penalty(dependency_findings))
        bug_score = _score_from_penalty(_severity_penalty(bug_findings))
        architecture_score = _score_from_penalty(_severity_penalty(architecture_findings))
        code_quality_score = _score_from_penalty(_severity_penalty(review_findings))

        # Overall score: weighted average
        active_scores = []
        if "security" in agents_selected or "dependency" in agents_selected:
            active_scores.append(security_score * 1.4)  # security weighted higher
        if "bug" in agents_selected:
            active_scores.append(bug_score * 1.2)
        if "architecture" in agents_selected:
            active_scores.append(architecture_score)
        if "review" in agents_selected:
            active_scores.append(code_quality_score)

        weights_sum = (
            (1.4 if "security" in agents_selected or "dependency" in agents_selected else 0)
            + (1.2 if "bug" in agents_selected else 0)
            + (1.0 if "architecture" in agents_selected else 0)
            + (1.0 if "review" in agents_selected else 0)
        ) or 1

        overall_score = round(sum(active_scores) / weights_sum) if active_scores else 100
        overall_score = max(0, min(100, overall_score))

        # --- Risk level ---
        all_findings = bug_findings + security_findings + architecture_findings + review_findings + dependency_findings
        total_critical = _critical_count(all_findings)
        if total_critical >= 5 or security_score < 50:
            risk_level = "critical"
        elif total_critical >= 2 or overall_score < 65:
            risk_level = "high"
        elif overall_score < 80:
            risk_level = "medium"
        else:
            risk_level = "low"

        # --- Action plan: prioritized items ---
        action_items = self._build_action_plan(
            bug_findings, security_findings, architecture_findings, review_findings, dependency_findings
        )

        # --- Repository summary ---
        repo_summary = self._build_summary(
            repo_id, overall_score, risk_level, all_findings, agents_selected
        )

        # --- Per-agent status ---
        agent_statuses = [
            {
                "agent": r.get("agent"),
                "status": r.get("status"),
                "findings_count": len(r.get("findings", [])) if isinstance(r.get("findings"), list) else (1 if r.get("findings") else 0),
                "sources": r.get("sources", []),
            }
            for r in agent_results
        ]

        return {
            "repo_id": repo_id,
            "task": task,
            "scores": {
                "overall_score": overall_score,
                "security_score": security_score,
                "bug_score": bug_score,
                "architecture_score": architecture_score,
                "code_quality_score": code_quality_score,
            },
            "risk_level": risk_level,
            "summary": repo_summary,
            "total_findings": len(all_findings),
            "critical_findings": total_critical,
            "findings": {
                "bugs": bug_findings,
                "security": security_findings,
                "architecture": architecture_findings,
                "code_review": review_findings,
                "dependencies": dependency_findings,
                "documentation": docs_findings if isinstance(docs_findings, list) else [],
            },
            "topology": topology,
            "action_plan": action_items,
            "agents_run": agents_selected,
            "agent_statuses": agent_statuses,
        }

    def _build_action_plan(
        self,
        bugs: list,
        security: list,
        architecture: list,
        review: list,
        dependencies: list,
    ) -> list[dict]:
        """Build a prioritized, deduplicated action plan across all agents."""
        items: list[dict] = []

        def _add(finding: dict, priority: int, category: str, action_key: str, fallback: str, file_key: str = "file") -> None:
            sev = str(finding.get("severity", "medium")).lower()
            action = finding.get("recommendation") or finding.get(action_key) or fallback
            # Truncate very long recommendations to keep action plan scannable
            if len(action) > 200:
                action = action[:197] + "…"
            items.append({
                "priority": priority,
                "category": category,
                "action": action,
                "severity": sev,
                "file": finding.get(file_key, ""),
                "confidence": _safe_int(finding.get("confidence")),
                "effort": finding.get("effort"),
            })

        # Priority 1 — critical/high security
        for f in security:
            if str(f.get("severity", "")).lower() in ("critical", "high"):
                _add(f, 1, "security", "issue", "Fix security vulnerability")

        # Priority 2 — critical/high bugs
        for f in bugs:
            if str(f.get("severity", "")).lower() in ("critical", "high"):
                _add(f, 2, "bug", "title", "Fix critical bug")

        # Priority 3 — critical/high dependencies
        for f in dependencies:
            if str(f.get("severity", "")).lower() in ("critical", "high"):
                pkg = f.get("package", "package")
                _add(f, 3, "dependency",
                     "package", f"Update {pkg} to a patched version",
                     "package")

        # Priority 4 — architecture (all severities)
        for f in architecture:
            _add(f, 4, "architecture", "issue", "Fix architecture issue", "affected_area")

        # Priority 5 — medium/high code review
        for f in review:
            if str(f.get("severity", "")).lower() != "low":
                _add(f, 5, "code_quality", "issue", "Improve code quality")

        # Priority 6 — medium/low bugs and security
        for f in bugs:
            if str(f.get("severity", "")).lower() not in ("critical", "high"):
                _add(f, 6, "bug", "title", "Fix bug")

        for f in security:
            if str(f.get("severity", "")).lower() not in ("critical", "high"):
                _add(f, 6, "security", "issue", "Address security issue")

        items.sort(key=_action_sort_key)
        return items[:20]

    def _build_summary(
        self,
        repo_id: str,
        score: int,
        risk_level: str,
        all_findings: list,
        agents: list,
    ) -> str:
        total = len(all_findings)
        critical_high = _critical_count(all_findings)
        critical_only = sum(1 for f in all_findings if str(f.get("severity", "")).lower() == "critical")
        agents_run = len(agents)

        if risk_level == "critical":
            posture = (
                f"{critical_only} critical finding{'s' if critical_only != 1 else ''} require immediate remediation. "
                "Security and stability are at significant risk."
            )
        elif risk_level == "high":
            posture = (
                f"{critical_high} critical/high severity finding{'s' if critical_high != 1 else ''} identified. "
                "Prioritize security and bug fixes before next release."
            )
        elif risk_level == "medium":
            posture = (
                f"{total} finding{'s' if total != 1 else ''} detected across {agents_run} agent{'s' if agents_run != 1 else ''}. "
                "Address high-priority items; medium issues can be scheduled."
            )
        else:
            posture = (
                f"{total} finding{'s' if total != 1 else ''} detected, none critical. "
                "Repository is in good health."
            )

        return (
            f"Overall health score: {score}/100. "
            f"Risk level: {risk_level.upper()}. "
            + posture
        )


action_engine = ActionEngine()
