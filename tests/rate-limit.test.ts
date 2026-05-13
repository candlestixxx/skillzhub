import { describe, it, expect, vi, beforeEach } from 'vitest'
import { rateLimit } from '../src/lib/rate-limit'

describe('Rate Limit Utility', () => {

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('bypasses rate limit in test environment', async () => {
        // Since process.env.NODE_ENV is 'test' in setup
        const isAllowed = await rateLimit('test-ip', 5, 3600)
        expect(isAllowed).toBe(true)
    })

    it('enforces limit when not in test env and limit exceeded', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const isAllowed = await rateLimit('prod-ip', 0, 3600)
        expect(isAllowed).toBe(false)

        process.env.NODE_ENV = originalEnv;
    })
})
