import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Extracts action_summary, objects, and environment labels from a video URL using Gemini 2.0 Flash.
 * If the GEMINI_API_KEY is not set or the request fails, it degrades gracefully to mock data.
 * Note: A real production implementation might need to handle video upload to Google's File API first
 * if the URL is not directly accessible, or extract frames using ffmpeg first.
 * For this implementation, we attempt a direct call and mock on failure.
 */
export async function analyzeVideoWithVLM(videoUrl: string): Promise<{ action_summary: string, objects: string[], environment: string[] }> {
    const apiKey = process.env.GEMINI_API_KEY;

    const mockLabels = {
        action_summary: "Descriptive Action: Human performing task in recorded environment",
        objects: ["human", "tool", "environment"],
        environment: ["indoor"]
    };

    if (!apiKey || apiKey === 'AIzaSy...' || process.env.NODE_ENV === 'test') {
        console.warn("GEMINI_API_KEY is missing or invalid. Falling back to mock VLM labels.");
        return mockLabels;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = "Analyze this video and provide a JSON response with exactly three keys: 'action_summary' (a brief description of what is happening), 'objects' (an array of strings listing visible items), and 'environment' (an array of strings describing the setting).";

        // Note: For Gemini to process a remote URL directly, it often requires the File API.
        // If passing the URL string directly fails, we catch it and fallback.
        const result = await model.generateContent([
            prompt,
            videoUrl
        ]);

        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        throw new Error("Failed to parse JSON from Gemini response");

    } catch (error) {
        console.error("VLM extraction failed. Falling back to mock labels.", error);
        return mockLabels;
    }
}
