"""
Deterministic static analysis on already-retrieved code chunks.

Runs BEFORE any LLM call and produces findings that do not require LLM
reasoning (hardcoded secrets, dependency manifests).  The results are
injected into the agent prompt as ``pre_identified_findings`` so the LLM
can focus on deeper analysis rather than rediscovering obvious issues.

Why on chunks (not the raw file system)?
─────────────────────────────────────────
The repository is deleted from disk after indexing (see scanner.py).
Running analysis on the Qdrant-retrieved chunks is the only way to avoid
re-cloning.  Chunk coverage is not 100 % but is sufficient for signal — the
LLM fills any gaps.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

# ── Secret detection patterns ─────────────────────────────────────────────────
# Each tuple: (compiled_regex, issue_label)
# Patterns deliberately avoid matching test files / fixture values by requiring
# non-trivial secret lengths (≥16 chars).

_SECRET_PATTERNS: list[tuple[re.Pattern, str]] = [
    (
        re.compile(
            r'(?i)(?:api_key|apikey|api-key)\s*[=:]\s*["\']([A-Za-z0-9_\-]{20,})["\']'
        ),
        "Hardcoded API key",
    ),
    (
        re.compile(
            r'(?i)(?:secret|secret_key|secretkey)\s*[=:]\s*["\']([A-Za-z0-9_\-]{16,})["\']'
        ),
        "Hardcoded secret",
    ),
    (
        re.compile(
            r'(?i)(?:password|passwd|pwd)\s*=\s*["\']([^"\']{8,})["\']'
        ),
        "Hardcoded password",
    ),
    (
        re.compile(
            r'(?i)(?:aws_access_key_id)\s*[=:]\s*["\']([A-Z0-9]{20})["\']'
        ),
        "AWS access key ID",
    ),
    (
        re.compile(
            r'(?i)(?:aws_secret_access_key)\s*[=:]\s*["\']([A-Za-z0-9\/+]{40})["\']'
        ),
        "AWS secret access key",
    ),
    (
        re.compile(
            r'(?i)(?:private_key|privatekey)\s*[=:]\s*["\']([A-Za-z0-9_\-\.]{20,})["\']'
        ),
        "Hardcoded private key",
    ),
    (
        re.compile(r'(?i)Bearer\s+([A-Za-z0-9\-_\.]{30,})', re.MULTILINE),
        "Bearer token in source code",
    ),
]

# ── Dependency manifest parsers ───────────────────────────────────────────────

_MANIFEST_FILENAMES = frozenset(
    ["package.json", "requirements.txt", "go.mod", "cargo.toml", "pom.xml"]
)


def _parse_npm(code: str) -> dict[str, str]:
    try:
        data = json.loads(code)
        return {
            **data.get("dependencies", {}),
            **data.get("devDependencies", {}),
        }
    except json.JSONDecodeError:
        return {}


def _parse_pip(code: str) -> dict[str, str]:
    deps: dict[str, str] = {}
    for raw_line in code.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        parts = re.split(r"[=<>!~;]", line, 1)
        name = parts[0].strip()
        if name:
            version = line[len(name):].strip().lstrip("=<>!~").strip() if len(parts) > 1 else "unspecified"
            deps[name] = version
    return deps


def _parse_gomod(code: str) -> dict[str, str]:
    deps: dict[str, str] = {}
    in_require = False
    for line in code.splitlines():
        stripped = line.strip()
        if stripped.startswith("require ("):
            in_require = True
            continue
        if in_require:
            if stripped == ")":
                in_require = False
                continue
            parts = stripped.split()
            if len(parts) >= 2:
                deps[parts[0]] = parts[1]
        elif stripped.startswith("require "):
            parts = stripped[len("require "):].split()
            if len(parts) >= 2:
                deps[parts[0]] = parts[1]
    return deps


# ── Public surface ────────────────────────────────────────────────────────────

class StaticAnalyzer:

    def scan_for_secrets(self, chunks: list[dict]) -> list[dict]:
        """
        Return a list of critical security findings detected by regex.
        One finding per unique (file, issue_type) pair to avoid noise.
        """
        findings: list[dict] = []
        seen: set[tuple[str, str]] = set()

        for chunk_data in chunks:
            code = chunk_data.get("chunk", "")
            filepath = chunk_data.get("file_path", "unknown")

            for pattern, label in _SECRET_PATTERNS:
                if pattern.search(code):
                    key = (filepath, label)
                    if key not in seen:
                        seen.add(key)
                        findings.append({
                            "issue": label,
                            "severity": "critical",
                            "file": filepath,
                            "recommendation": (
                                "Remove from source code, move to environment variables, "
                                "and rotate the credential immediately."
                            ),
                            "detected_by": "static_analysis",
                        })

        return findings

    def extract_dependency_info(self, chunks: list[dict]) -> dict[str, Any]:
        """
        Parse dependency manifests from chunks without any LLM call.
        Returns {"packages": {name: version}, "manifests": [...], "count": n}.
        """
        all_packages: dict[str, str] = {}
        manifests: list[str] = []

        for chunk_data in chunks:
            filepath = (chunk_data.get("file_path") or "").lower()
            code = chunk_data.get("chunk", "")
            filename = filepath.rsplit("/", 1)[-1]

            if filename not in _MANIFEST_FILENAMES:
                continue

            parsed: dict[str, str] = {}
            if filename == "package.json":
                parsed = _parse_npm(code)
            elif filename == "requirements.txt":
                parsed = _parse_pip(code)
            elif filename == "go.mod":
                parsed = _parse_gomod(code)

            if parsed:
                all_packages.update(parsed)
                if filename not in manifests:
                    manifests.append(filename)

        return {
            "packages": all_packages,
            "manifests": manifests,
            "count": len(all_packages),
        }

    def collect_all_chunks(
        self, contexts: dict[str, tuple[str, list[str]]]
    ) -> list[dict]:
        """
        Flatten context strings back into chunk dicts for static analysis.
        Deduplicates by chunk hash so secrets are reported once.
        """
        seen: set[int] = set()
        chunks: list[dict] = []

        for context_str, _sources in contexts.values():
            for block in context_str.split("\n\n"):
                lines = block.splitlines()
                if not lines:
                    continue
                file_path = (
                    lines[0].removeprefix("File: ")
                    if lines[0].startswith("File: ")
                    else "unknown"
                )
                # Strip the opening/closing ``` fence lines
                inner = lines[2:-1] if len(lines) > 2 else lines
                chunk_text = "\n".join(inner)
                key = hash(chunk_text)
                if key not in seen:
                    seen.add(key)
                    chunks.append({"chunk": chunk_text, "file_path": file_path})

        return chunks


static_analyzer = StaticAnalyzer()
