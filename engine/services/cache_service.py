"""
Redis-backed analysis cache with graceful degradation.

If Redis is unavailable (no URL configured, connection refused, timeout)
the service silently disables itself and the system continues without caching.
No crash, no exception propagation to callers.

Cache key schema
─────────────────
  continuum:analysis:{repo_id}:{agent_name}:{task_hash8}

task_hash8  — first 8 chars of MD5(task.lower().strip())
             Keeps keys stable for semantically identical tasks.

Invalidation
─────────────
Call ``invalidate_repo(repo_id)`` after a re-index to purge all cached
results for that repository before new agent runs are stored.
"""
from __future__ import annotations

import hashlib
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

try:
    import redis as _redis_lib
    _REDIS_IMPORTABLE = True
except ImportError:
    _REDIS_IMPORTABLE = False


class CacheService:
    def __init__(self) -> None:
        self._client = None
        self._enabled = False

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    def connect(self, redis_url: str, ttl: int = 3600) -> None:
        """
        Attempt to connect to Redis.  Must be called at application startup
        (e.g. FastAPI on_event("startup")).
        """
        self._default_ttl = ttl

        if not _REDIS_IMPORTABLE:
            logger.warning("redis package not installed — caching disabled")
            return
        if not redis_url:
            logger.info("REDIS_URL not configured — caching disabled")
            return

        try:
            client = _redis_lib.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            client.ping()
            self._client = client
            self._enabled = True
            logger.info("Redis cache connected (%s)", redis_url)
        except Exception as exc:
            logger.warning("Redis unavailable — caching disabled: %s", exc)

    @property
    def enabled(self) -> bool:
        return self._enabled

    # ── Key construction ──────────────────────────────────────────────────────

    def _key(self, repo_id: str, agent: str, task: str) -> str:
        task_hash = hashlib.md5(
            task.lower().strip().encode(), usedforsecurity=False
        ).hexdigest()[:8]
        return f"continuum:analysis:{repo_id}:{agent}:{task_hash}"

    # ── Read / write ──────────────────────────────────────────────────────────

    async def get(self, repo_id: str, agent: str, task: str) -> Optional[dict]:
        if not self._enabled:
            return None
        try:
            raw = self._client.get(self._key(repo_id, agent, task))
            return json.loads(raw) if raw else None
        except Exception as exc:
            logger.debug("Cache.get error: %s", exc)
            return None

    async def set(
        self,
        repo_id: str,
        agent: str,
        task: str,
        data: dict,
        ttl: Optional[int] = None,
    ) -> None:
        if not self._enabled:
            return
        try:
            self._client.setex(
                self._key(repo_id, agent, task),
                ttl if ttl is not None else self._default_ttl,
                json.dumps(data),
            )
        except Exception as exc:
            logger.debug("Cache.set error: %s", exc)

    # ── Invalidation ──────────────────────────────────────────────────────────

    def invalidate_repo(self, repo_id: str) -> int:
        """
        Delete all cached agent results for *repo_id*.
        Returns the number of keys removed.
        """
        if not self._enabled:
            return 0
        try:
            pattern = f"continuum:analysis:{repo_id}:*"
            keys = self._client.keys(pattern)
            if keys:
                return self._client.delete(*keys)
        except Exception as exc:
            logger.debug("Cache.invalidate error: %s", exc)
        return 0


cache_service = CacheService()
