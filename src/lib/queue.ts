import { Queue } from 'bullmq'
import Redis from 'ioredis'

let connection: Redis | null = null;

function getConnection() {
    if (!connection) {
        connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            retryStrategy: () => null
        });

        connection.on('error', (error) => {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('Redis connection failed:', error.message);
            }
        });
    }
    return connection;
}

export const processingQueue = new Proxy({} as Queue, {
    get: (target, prop) => {
        if (!target[prop as keyof Queue]) {
             const q = new Queue('video-processing', { connection: getConnection() });
             return q[prop as keyof Queue];
        }
        return target[prop as keyof Queue];
    }
});
