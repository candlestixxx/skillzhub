import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeVideoWithVLM } from '../src/lib/services/vlm';

// Mock the Google Generative AI classes
const mockGenerateContent = vi.fn();
const mockUploadFile = vi.fn();
const mockGetFile = vi.fn();
const mockDeleteFile = vi.fn();

vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: class {
            getGenerativeModel() {
                return { generateContent: mockGenerateContent };
            }
        }
    };
});

vi.mock('@google/generative-ai/server', () => {
    return {
        GoogleAIFileManager: class {
            uploadFile = mockUploadFile;
            getFile = mockGetFile;
            deleteFile = mockDeleteFile;
        }
    };
});

// Mock fs to avoid actually writing/deleting temp files during test
vi.mock('fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('fs')>();
    return {
        ...actual,
        createWriteStream: vi.fn(() => ({
            on: vi.fn(),
            write: vi.fn(),
            end: vi.fn()
        })),
        existsSync: vi.fn(() => true),
        unlinkSync: vi.fn()
    };
});

// Mock pipeline to resolve immediately
vi.mock('stream/promises', async (importOriginal) => {
    const actual = await importOriginal<typeof import('stream/promises')>();
    return {
        ...actual,
        pipeline: vi.fn().mockResolvedValue(undefined)
    };
});

const fallbackLabels = {
    action_summary: "Descriptive Action: Human performing task in recorded environment",
    objects: ["human", "tool", "environment"],
    environment: ["indoor"]
};

describe('VLM Processor', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env = { ...originalEnv };

        // Mock global fetch to avoid real network requests
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            body: new ReadableStream({
                start(controller) {
                    controller.close();
                }
            })
        });
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('returns fallback labels if GEMINI_API_KEY is not set', async () => {
        delete process.env.GEMINI_API_KEY;

        const result = await analyzeVideoWithVLM('http://example.com/video.mp4');
        expect(result).toEqual(fallbackLabels);
    });

    it('returns fallback labels if NODE_ENV is test', async () => {
        process.env.GEMINI_API_KEY = 'test_key';
        process.env.NODE_ENV = 'test';

        const result = await analyzeVideoWithVLM('http://example.com/video.mp4');
        expect(result).toEqual(fallbackLabels);
    });

    it('successfully analyzes a video with valid API key', async () => {
        process.env.GEMINI_API_KEY = 'test_key';
        delete process.env.NODE_ENV;

        mockUploadFile.mockResolvedValue({
            file: {
                name: 'test-file',
                uri: 'gs://test-uri',
                mimeType: 'video/mp4',
                state: 'ACTIVE'
            }
        });

        const mockResponse = {
            action_summary: "Test action",
            objects: ["test-obj"],
            environment: ["test-env"]
        };

        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => JSON.stringify(mockResponse)
            }
        });

        const result = await analyzeVideoWithVLM('http://example.com/video.mp4');

        expect(result).toEqual(mockResponse);
        expect(mockUploadFile).toHaveBeenCalled();
        expect(mockGenerateContent).toHaveBeenCalled();
        expect(mockDeleteFile).toHaveBeenCalledWith('test-file');
    });

    it('polls if file state is PROCESSING', async () => {
        process.env.GEMINI_API_KEY = 'test_key';
        delete process.env.NODE_ENV;

        mockUploadFile.mockResolvedValue({
            file: {
                name: 'test-file',
                uri: 'gs://test-uri',
                mimeType: 'video/mp4',
                state: 'PROCESSING'
            }
        });

        mockGetFile.mockResolvedValueOnce({ state: 'PROCESSING' })
                   .mockResolvedValueOnce({ state: 'ACTIVE' });

        const mockResponse = {
            action_summary: "Test action",
            objects: ["test-obj"],
            environment: ["test-env"]
        };

        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => JSON.stringify(mockResponse)
            }
        });

        // Mock setTimeout to resolve immediately so test doesn't actually wait 5s
        vi.spyOn(global, 'setTimeout').mockImplementation((cb) => {
            (cb as (...args: unknown[]) => void)();
            return {} as unknown as ReturnType<typeof setTimeout>;
        });

        const result = await analyzeVideoWithVLM('http://example.com/video.mp4');

        expect(result).toEqual(mockResponse);
        expect(mockGetFile).toHaveBeenCalledTimes(2);

        vi.restoreAllMocks();
    });

    it('returns fallback labels if Gemini returns invalid JSON', async () => {
        process.env.GEMINI_API_KEY = 'test_key';
        delete process.env.NODE_ENV;

        mockUploadFile.mockResolvedValue({
            file: {
                name: 'test-file',
                uri: 'gs://test-uri',
                mimeType: 'video/mp4',
                state: 'ACTIVE'
            }
        });

        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => "Invalid response without JSON"
            }
        });

        const result = await analyzeVideoWithVLM('http://example.com/video.mp4');
        expect(result).toEqual(fallbackLabels);
    });
});
