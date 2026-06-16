/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from 'vitest'

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost'

// Polyfill for Request to ensure body parsing works in tests
if (typeof Request === 'undefined') {
  global.Request = class Request {} as any;
}

// Mock next/server
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn((body, init) => {
        return {
          status: init?.status || 200,
          json: async () => body
        }
      }),
      next: vi.fn()
    },
    NextRequest: class MockNextRequest {
      url: string;
      method: string;
      bodyText: string;
      headers: Map<string, string>;
      constructor(url: string, init?: { method?: string, body?: string, headers?: Record<string, string> }) {
        this.url = url;
        this.method = init?.method || 'GET';
        this.bodyText = init?.body || '';
        this.headers = new Map(Object.entries(init?.headers || {}));
      }
      async json() {
        if (!this.bodyText) throw new Error("No body");
        return JSON.parse(this.bodyText);
      }
    }
  }
})

// Mock IORedis
vi.mock('ioredis', () => {
  const MockRedisClient = vi.fn().mockImplementation(() => {
    return {
      get: vi.fn(),
      eval: vi.fn().mockResolvedValue(1),
      multi: vi.fn().mockReturnValue({
          incr: vi.fn().mockReturnThis(),
          expire: vi.fn().mockReturnThis(),
          exec: vi.fn().mockResolvedValue([])
      }),
      on: vi.fn()
    }
  });
  return {
    default: MockRedisClient
  }
})

// Mock bullmq
vi.mock('bullmq', () => {
  return {
    Queue: vi.fn(() => ({
      add: vi.fn().mockResolvedValue({ id: 'job-1' })
    })),
    Worker: vi.fn()
  }
})
