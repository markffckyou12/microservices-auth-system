"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeRedis = exports.getRedis = exports.setupRedis = void 0;
const redis_1 = require("redis");
let redisClient;
const setupRedis = async () => {
    const config = {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379')
        }
    };
    redisClient = (0, redis_1.createClient)(config);
    redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
    });
    redisClient.on('connect', () => {
        console.log('Redis Client Connected');
    });
    redisClient.on('ready', () => {
        console.log('Redis Client Ready');
    });
    try {
        await redisClient.connect();
        console.log('Redis connection established successfully');
    }
    catch (error) {
        console.error('Redis connection failed:', error);
        throw error;
    }
};
exports.setupRedis = setupRedis;
const getRedis = () => {
    if (!redisClient) {
        throw new Error('Redis not initialized. Call setupRedis() first.');
    }
    return redisClient;
};
exports.getRedis = getRedis;
const closeRedis = async () => {
    if (redisClient) {
        await redisClient.disconnect();
        console.log('Redis connection closed');
    }
};
exports.closeRedis = closeRedis;
//# sourceMappingURL=redis.js.map