"""
Action Engine — aggregates multi-agent results into a unified report with
health scores, risk summaries, and prioritized action plans.
"""
from __future__ import annotations
import math
from typing import Any


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
        bug_findings = _extract_findings(agent_results, "bug")
        security_findings = _extract_findings(agent_results, "security")
        architecture_findings = _extract_findings(agent_results, "architecture")
        topology = _extract_topology(agent_results)
        review_findings = _extract_findings(agent_results, "review")
        dependency_findings = _extract_findings(agent_results, "dependency")
        docs_findings = _extract_findings(agent_results, "docs")

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

        # Critical and high severity first
        for finding in security:
            sev = str(finding.get("severity", "medium")).lower()
            if sev in ("critical", "high"):
                items.append({
                    "priority": 1,
                    "category": "security",
                    "action": finding.get("recommendation", finding.get("issue", "Fix security issue")),
                    "severity": sev,
                    "file": finding.get("file", ""),
                })

        for finding in bugs:
            sev = str(finding.get("severity", "medium")).lower()
            if sev in ("critical", "high"):
                items.append({
                    "priority": 2,
                    "category": "bug",
                    "action": finding.get("recommendation", finding.get("title", "Fix bug")),
                    "severity": sev,
                    "file": finding.get("file", ""),
                })

        for finding in dependencies:
            sev = str(finding.get("severity", "medium")).lower()
            if sev in ("critical", "high"):
                items.append({
                    "priority": 3,
                    "category": "dependency",
                    "action": finding.get("recommendation", f"Update {finding.get('package', 'package')}"),
                    "severity": sev,
                    "file": "dependency manifest",
                })

        # Medium severity
        for finding in architecture:
            sev = str(finding.get("severity", "medium")).lower()
            items.append({
                "priority": 4,
                "category": "architecture",
                "action": finding.get("recommendation", finding.get("issue", "Fix architecture issue")),
                "severity": sev,
                "file": finding.get("affected_area", ""),
            })

        for finding in review:
            sev = str(finding.get("severity", "medium")).lower()
            if sev != "low":
                items.append({
                    "priority": 5,
                    "category": "code_quality",
                    "action": finding.get("recommendation", finding.get("issue", "Improve code quality")),
                    "severity": sev,
                    "file": finding.get("file", ""),
                })

        # Low priority: remaining
        for finding in bugs:
            sev = str(finding.get("severity", "medium")).lower()
            if sev not in ("critical", "high"):
                items.append({
                    "priority": 6,
                    "category": "bug",
                    "action": finding.get("recommendation", finding.get("title", "Fix bug")),
                    "severity": sev,
                    "file": finding.get("file", ""),
                })

        items.sort(key=lambda x: (x["priority"], {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(x["severity"], 2)))
        return items[:20]  # Cap at 20 action items

    def _build_summary(
        self,
        repo_id: str,
        score: int,
        risk_level: str,
        all_findings: list,
        agents: list,
    ) -> str:
        total = len(all_findings)
        critical = _critical_count(all_findings)
        grade = "excellent" if score >= 90 else "good" if score >= 75 else "needs attention" if score >= 55 else "poor"
        agents_str = ", ".join(agents)

        return (
            f"Repository '{repo_id}' received an overall health score of {score}/100 ({grade}). "
            f"Analysis covered: {agents_str}. "
            f"Total findings: {total} ({critical} critical/high severity). "
            f"Risk level: {risk_level.upper()}. "
            + (
                "Immediate action required on critical security and bug findings."
                if risk_level in ("critical", "high")
                else "Repository is in reasonable health with some areas for improvement."
                if risk_level == "medium"
                else "Repository is in good health."
            )
        )


action_engine = ActionEngine()
