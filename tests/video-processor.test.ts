import { describe, it, expect } from 'vitest'
import { extractMetadata } from '../src/lib/video-processor'
import type { FfprobeData } from 'fluent-ffmpeg'

describe('Video Processor', () => {
    it('correctly extracts metadata from ffprobe output', () => {
        const mockProbeData: Partial<FfprobeData> = {
            streams: [
                {
                    index: 0,
                    codec_type: 'audio'
                },
                {
                    index: 1,
                    codec_type: 'video',
                    width: 3840,
                    height: 2160,
                    r_frame_rate: '60000/1001'
                }
            ],
            format: {
                duration: 45.123
            }
        }

        const result = extractMetadata(mockProbeData as FfprobeData)

        expect(result.width).toBe(3840)
        expect(result.height).toBe(2160)
        expect(result.fps).toBe(60) // Math.round(60000/1001) = 60
        expect(result.duration).toBe(45) // Math.round(45.123) = 45
    })

    it('uses defaults when stream data is missing', () => {
        const mockEmptyData: Partial<FfprobeData> = {
            streams: [],
            format: {}
        }

        const result = extractMetadata(mockEmptyData as FfprobeData)

        expect(result.width).toBe(1920)
        expect(result.height).toBe(1080)
        expect(result.fps).toBe(60)
        expect(result.duration).toBe(120)
    })
})
