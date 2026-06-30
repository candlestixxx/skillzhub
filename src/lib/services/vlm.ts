import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "fs";
import path from "path";
import os from "os";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

/**
 * Downloads a file from a URL to a temporary local path using streams
 * to prevent large video files from exhausting Node.js heap memory.
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);
    if (!response.body) throw new Error("Response body is empty");

    // Convert the web stream to a Node.js readable stream
    // @ts-expect-error - Readable.fromWeb handles the web stream properly in modern Node.js
    const readable = Readable.fromWeb(response.body);
    const writeStream = fs.createWriteStream(destPath);

    await pipeline(readable, writeStream);
}

/**
 * Extracts action_summary, objects, and environment labels from a video URL using Gemini 2.0 Flash.
 * If the GEMINI_API_KEY is not set or the request fails, it degrades gracefully to mock data.
 * This implementation downloads the video to a temp file and uses the Google File API for reliable ingestion.
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

    let tempFilePath = "";
    let uploadedFileName = "";
    let fileManager: GoogleAIFileManager | null = null;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        fileManager = new GoogleAIFileManager(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // 1. Download video to a temporary file
        const tempDir = os.tmpdir();
        const fileExt = videoUrl.split('?')[0].split('.').pop() || 'mp4';
        tempFilePath = path.join(tempDir, `vlm_${Date.now()}.${fileExt}`);

        console.log(`Downloading video for VLM processing to ${tempFilePath}...`);
        await downloadFile(videoUrl, tempFilePath);

        // 2. Upload the file using GoogleAIFileManager
        console.log(`Uploading video to Google File API...`);
        const uploadResponse = await fileManager.uploadFile(tempFilePath, {
            mimeType: `video/${fileExt === 'webm' ? 'webm' : 'mp4'}`,
            displayName: "SkillzHub Video Sample",
        });

        uploadedFileName = uploadResponse.file.name;
        console.log(`Upload complete. File URI: ${uploadResponse.file.uri}`);

        // 3. Poll for processing completion if necessary (videos take time to process)
        let fileState = uploadResponse.file.state;
        while (fileState === "PROCESSING") {
             console.log("Waiting for video processing to complete on Google's servers...");
             await new Promise((resolve) => setTimeout(resolve, 5000));
             const fileInfo = await fileManager.getFile(uploadedFileName);
             fileState = fileInfo.state;
             if (fileState === "FAILED") {
                 throw new Error("Google API failed to process the uploaded video.");
             }
        }

        // 4. Generate content using the uploaded file's URI
        const prompt = "Analyze this video and provide a JSON response with exactly three keys: 'action_summary' (a brief description of what is happening), 'objects' (an array of strings listing visible items), and 'environment' (an array of strings describing the setting).";

        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: uploadResponse.file.mimeType,
                    fileUri: uploadResponse.file.uri
                }
            },
            { text: prompt },
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
    } finally {
        // Clean up: delete local temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
            } catch (cleanupError) {
                console.error(`Failed to delete temporary file ${tempFilePath}:`, cleanupError);
            }
        }

        // Clean up: delete from Google File API
        if (fileManager && uploadedFileName) {
            try {
                await fileManager.deleteFile(uploadedFileName);
                console.log(`Deleted file ${uploadedFileName} from Google File API.`);
            } catch (deleteError) {
                console.error(`Failed to delete file ${uploadedFileName} from Google File API:`, deleteError);
            }
        }
    }
}
