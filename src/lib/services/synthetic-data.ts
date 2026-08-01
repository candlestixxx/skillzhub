import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateSyntheticData(vlmLabels: unknown, videoUrl: string) {
    console.log(`Generating synthetic data logic for video URL: ${videoUrl}`);

    const baseLabels = vlmLabels && typeof vlmLabels === 'object' ? vlmLabels : {};

    const apiKey = process.env.GEMINI_API_KEY;

    // If no API key is provided, or in a test environment, fallback to simulated logic
    if (!apiKey || process.env.NODE_ENV === 'test') {
        console.warn("GEMINI_API_KEY is missing or invalid. Falling back to hardcoded simulated augmentations.");
        return {
            ...baseLabels,
            synthetic_augmentations: ["lighting_variations", "noise_injection"],
            simulated_environment: "indoor_kitchen_alt",
            generated_at: new Date().toISOString()
        };
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-2.0-flash for high-speed, structured text logic synthesis
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
        You are an advanced robotics and machine learning synthetic data engine.
        Given the following VLM-extracted labels from an FPV video:
        ${JSON.stringify(baseLabels)}

        Generate a JSON object describing exactly 3 synthetic data augmentations
        (e.g., "rain_simulation", "occlusion_injection", "night_vision_filter")
        that would make this specific dataset more robust for training AI models.
        Also, suggest a new 'simulated_environment' setting.

        Format the response as pure JSON matching this structure:
        {
          "synthetic_augmentations": ["string", "string", "string"],
          "simulated_environment": "string"
        }
        Do not include markdown blocks like \`\`\`json.
        `;

        const result = await model.generateContent(prompt);
        let rawText = result.response.text();
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        const llmData = JSON.parse(rawText);

        return {
            ...baseLabels,
            synthetic_augmentations: llmData.synthetic_augmentations,
            simulated_environment: llmData.simulated_environment,
            generated_at: new Date().toISOString()
        };
    } catch (e) {
        console.error("Failed to generate synthetic data with Gemini:", e);
        return {
            ...baseLabels,
            synthetic_augmentations: ["fallback_augmentation"],
            simulated_environment: "fallback_environment",
            generated_at: new Date().toISOString()
        };
    }
}
