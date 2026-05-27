import Redis from 'ioredis';
import logger from './logger';

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
};

export const redisClient = new Redis(redisOptions);
export const redisPubSub = new Redis(redisOptions);

redisClient.on('connect', () => logger.info('Redis connected'));
redisClient.on('error', (err) => logger.error('Redis error', { err }));

export const getRedisConnection = () => redisOptions;
