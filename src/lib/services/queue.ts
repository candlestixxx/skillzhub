import { Queue } from 'bullmq'
import Redis from 'ioredis'

let connection: Redis | null = null;
let queueInstance: Queue | null = null;

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
        if (!queueInstance) {
             queueInstance = new Queue('video-processing', { connection: getConnection() });
        }
        const val = queueInstance[prop as keyof Queue];
        if (typeof val === 'function') {
             return val.bind(queueInstance);
        }
        return val;
    }
});

let syntheticQueueInstance: Queue | null = null;
export const syntheticQueue = new Proxy({} as Queue, {
    get: (target, prop) => {
        if (!syntheticQueueInstance) {
             syntheticQueueInstance = new Queue('synthetic-data', { connection: getConnection() });
        }
        const val = syntheticQueueInstance[prop as keyof Queue];
        if (typeof val === 'function') {
             return val.bind(syntheticQueueInstance);
        }
        return val;
    }
});
