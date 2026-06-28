import { describe, it, expect } from 'vitest'
import { analyzeVideoWithVLM } from '../src/lib/services/vlm-processor'
import { VLMLabelsSchema } from '../src/lib/schemas'

describe('VLM Processor Validation', () => {
    it('returns mock data that matches the schema when API key is missing or invalid in test env', async () => {
        const result = await analyzeVideoWithVLM('https://example.com/test.mp4')
        expect(() => VLMLabelsSchema.parse(result)).not.toThrow()
        expect(result.action_summary).toBeDefined()
        expect(result.objects.length).toBeGreaterThan(0)
    })
})
