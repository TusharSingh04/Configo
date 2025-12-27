import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/featureflags',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  serviceToken: process.env.SERVICE_TOKEN || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS || 60),
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  authAllowSignup: String(process.env.AUTH_ALLOW_SIGNUP || 'false').toLowerCase() === 'true',
  
  // Email configuration
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@featureflags.local',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
} as const;

