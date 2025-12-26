import Redis from 'ioredis';
import { config } from '../config.js';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const isTls = config.redisUrl.startsWith('rediss://');
    redis = new Redis(config.redisUrl, { 
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      enableOfflineQueue: true,
      tls: isTls ? { 
        rejectUnauthorized: false,
        servername: extractHostname(config.redisUrl)
      } : undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });
    redis.on('error', (err) => {
      console.warn('Redis connection error:', err.message);
    });
  }
  return redis;
}

function extractHostname(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return 'redis';
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  return getRedis().get(key);
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<'OK' | null> {
  return getRedis().set(key, value, 'EX', ttlSeconds);
}
