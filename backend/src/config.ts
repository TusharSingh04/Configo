import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/featureflags',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  serviceToken: process.env.SERVICE_TOKEN || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS || 60),
} as const;
