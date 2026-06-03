"""
Lightweight in-memory observability tracker.

Records per-agent latency, token estimates, cache hit rate, and Qdrant search
latency so the dashboard can surface real efficiency metrics without a
third-party APM dependency.
"""
from __future__ import annotations

import threading
import time
from collections import defaultdict
from typing import Any


class Metrics:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._counters: dict[str, int] = defaultdict(int)
        self._timings: dict[str, list[float]] = defaultdict(list)
        self._started_at: float = time.time()

    # ── Counters ──────────────────────────────────────────────────────────────

    def inc(self, key: str, n: int = 1) -> None:
        with self._lock:
            self._counters[key] += n

    # ── Timings (milliseconds) ────────────────────────────────────────────────

    def record(self, key: str, value_ms: float) -> None:
        with self._lock:
            self._timings[key].append(value_ms)

    # ── Context manager for timing a block ───────────────────────────────────

    def timer(self, key: str):
        return _Timer(self, key)

    # ── Summary for the /metrics endpoint ────────────────────────────────────

    def summary(self) -> dict[str, Any]:
        with self._lock:
            out: dict[str, Any] = {
                "uptime_seconds": round(time.time() - self._started_at),
            }
            for k, v in self._counters.items():
                out[k] = v

            for k, vals in self._timings.items():
                if not vals:
                    continue
                out[f"{k}_avg_ms"] = round(sum(vals) / len(vals), 1)
                out[f"{k}_p95_ms"] = round(sorted(vals)[int(len(vals) * 0.95)], 1)
                out[f"{k}_total_ms"] = round(sum(vals), 1)
                out[f"{k}_count"] = len(vals)

            # Derived: cache hit rate
            hits = self._counters.get("cache_hits", 0)
            misses = self._counters.get("cache_misses", 0)
            total = hits + misses
            out["cache_hit_rate"] = round(hits / total, 3) if total else 0.0

            # Derived: estimated token savings from cache
            out["cache_token_savings_est"] = hits * 4000  # ~4K tokens per cached agent

        return out

    def reset(self) -> None:
        with self._lock:
            self._counters.clear()
            self._timings.clear()
            self._started_at = time.time()


class _Timer:
    def __init__(self, metrics: Metrics, key: str) -> None:
        self._metrics = metrics
        self._key = key
        self._start: float = 0.0

    def __enter__(self):
        self._start = time.monotonic()
        return self

    def __exit__(self, *_):
        self._metrics.record(self._key, (time.monotonic() - self._start) * 1000)


metrics = Metrics()
