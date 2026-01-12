"""Redis service module."""

import logging
from typing import Any, Dict

import redis
from config import REDIS_HOST, REDIS_PORT

logger = logging.getLogger(__name__)


class RedisService:
    """Service class for Redis operations."""

    @staticmethod
    def get_info() -> Dict[str, Any]:
        """Get detailed info from Redis."""
        try:
            r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
            info = r.info()
            return {
                "status": "connected",
                "host": REDIS_HOST,
                "port": REDIS_PORT,
                "version": info.get("redis_version"),
                "uptime_days": info.get("uptime_in_days"),
                "used_memory_human": info.get("used_memory_human"),
                "connected_clients": info.get("connected_clients"),
                "keys": r.dbsize(),
            }
        except Exception as e:
            logger.error(f"Redis connection error: {e}")
            return {"status": "error", "message": str(e)}
