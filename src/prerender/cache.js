const TTL_MS = (parseInt(process.env.CACHE_TTL_SECONDS, 10) || 86400) * 1000;
const MAX_ITEMS = parseInt(process.env.CACHE_MAX_ITEMS, 10) || 500;

class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value) {
    if (this.store.size >= MAX_ITEMS) {
      const oldest = this.store.keys().next().value;
      this.store.delete(oldest);
    }
    this.store.set(key, { value, expiresAt: Date.now() + TTL_MS });
  }

  has(key) {
    return this.get(key) !== null;
  }

  invalidate(key) {
    this.store.delete(key);
  }

  flush() {
    this.store.clear();
  }

  get size() {
    return this.store.size;
  }
}

let cache;

const initCache = async () => {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const Redis = require('ioredis');
      const redis = new Redis(redisUrl, {
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
      });
      redis.on('error', (err) => {
        console.warn('[prerender-cache] Redis error, falling back to in-memory:', err.message);
      });
      redis.on('connect', () => console.log('[prerender-cache] Connected to Redis'));
      cache = {
        async get(key) {
          const val = await redis.get(key);
          return val ? JSON.parse(val) : null;
        },
        async set(key, value) {
          await redis.setex(key, TTL_MS / 1000, JSON.stringify(value));
        },
        async has(key) {
          const exists = await redis.exists(key);
          return exists === 1;
        },
        async invalidate(key) {
          await redis.del(key);
        },
        async flush() {
          await redis.flushdb();
        },
        get size() {
          return 'redis';
        },
      };
      return;
    } catch (err) {
      console.warn('[prerender-cache] Redis unavailable, using in-memory:', err.message);
    }
  }
  cache = new MemoryCache();
  console.log('[prerender-cache] Using in-memory store (max items: %d, TTL: %ds)', MAX_ITEMS, TTL_MS / 1000);
};

const getCache = () => {
  if (!cache) throw new Error('Cache not initialized. Call initCache() first.');
  return cache;
};

module.exports = { initCache, getCache, MemoryCache };
