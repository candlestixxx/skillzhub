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

export function getProcessingQueue() {
  if (!queueInstance) {
    // Queue name must match the worker's subscribed queue in worker.ts.
    queueInstance = new Queue('video-processing', { connection: getConnection() })
  }
  return queueInstance
}
