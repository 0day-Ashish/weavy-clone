import { task, logger } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const generateContentTask = task({
  id: "generate-content",
  run: async (payload: { prompt: string; model: string; systemPrompt?: string; imageUrls?: string[] }, { ctx }) => {
    
    // Fallback to 'gemini-2.5-flash' if model is missing or invalid
    const modelName = payload.model || "gemini-2.5-flash";

    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: payload.systemPrompt
    });

    let contentParts: any[] = [];

    // new multi-image logic start
    if (payload.imageUrls && payload.imageUrls.length > 0) {
      
      // loop through every image URL in the array
      for (const url of payload.imageUrls) {
        
        let mimeType = "image/png";
        let base64Data = "";

        // case 1: URL -> Download it
        if (url.startsWith("http")) {
          await logger.info("Downloading image...", { url });
          try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            base64Data = Buffer.from(arrayBuffer).toString("base64");
            const contentType = response.headers.get("content-type");
            if (contentType) mimeType = contentType;
          } catch (error) {
            console.error(`Failed to download ${url}`, error);
            continue; // skip this bad image, try the next one
          }
        } 
        // case 2: base64 with prefix
        else if (url.includes("base64,")) {
          const parts = url.split(",");
          const matches = parts[0].match(/:(.*?);/);
          if (matches && matches.length > 1) mimeType = matches[1];
          base64Data = parts[1];
        } 
        // case 3: raw base64
        else {
          base64Data = url;
        }

        // add this specific image to the payload
        contentParts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }
    }
    // new multi-image logic end

    if (payload.prompt) {
      contentParts.push({ text: payload.prompt });
    }

    try {
      const result = await model.generateContent(contentParts);
      const text = result.response.text();
      return { text };
    } catch (error: any) {
      // log the full error to help debugging
      await logger.error("Gemini API Error", { error: error.message });
      throw error;
    }
  },
});
