import Redis from 'ioredis'

// Simple Token Bucket Rate Limiter using Redis
let redisClient: Redis | null = null;

function getRedisClient() {
    if (!redisClient) {
        redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            retryStrategy: () => null
        });
        redisClient.on('error', (error) => {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('Redis rate limiter error:', error.message);
            }
        });
    }
    return redisClient;
}

export async function rateLimit(identifier: string, limit: number, windowSec: number): Promise<boolean> {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
       return true; // Bypass rate limit locally or in test
    }
    if (limit <= 0) {
        return false;
    }

    try {
        const client = getRedisClient();
        const key = `ratelimit:${identifier}`;

        // Use a Lua script for atomic get-and-increment to avoid race conditions
        const script = `
            local current = redis.call("INCR", KEYS[1])
            if current == 1 then
                redis.call("EXPIRE", KEYS[1], ARGV[1])
            end
            return current
        `;

        const result = await client.eval(script, 1, key, windowSec);

        // If current hits limit, block
        if (result && parseInt(result as string, 10) > limit) {
            return false; // Rate limit exceeded
        }

        return true;
    } catch (error) {
        // Fail open if Redis is down
        return true;
    }
}
