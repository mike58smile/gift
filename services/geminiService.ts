import { GoogleGenAI } from "@google/genai";
import { cleanBase64 } from "./imageUtils";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to validate API key availability
export const checkApiKey = (): boolean => {
  return !!apiKey;
};

export const generateDescription = async (
  base64Image: string,
  instruction: string,
  language: string
): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64(base64Image)
            }
          },
          {
            text: `Follow this instruction for the image content: "${instruction}". Respond in ${language}. Keep it under 200 words.`
          }
        ]
      }
    });

    return response.text || "No output available.";
  } catch (error) {
    console.error("Error generating text output:", error);
    return "Failed to generate output.";
  }
};

export const styleImage = async (base64Image: string, stylePrompt: string): Promise<string> => {
  try {
    // Using gemini-2.5-flash-image (Nano Banana) as requested for image redesign
    const model = 'gemini-2.5-flash-image';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64(base64Image)
            }
          },
          {
            // Prompt updated to explicitly ask for a redesign to ensure style transfer is applied strongly
            text: `Redesign this image in the style of "${stylePrompt}".`
          }
        ]
      }
    });

    // Extract the image from the response
    // The response candidates parts will contain the image
    const parts = response.candidates?.[0]?.content?.parts;
    
    if (parts) {
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }

    throw new Error("No image generated in response");
  } catch (error) {
    console.error("Error styling image:", error);
    throw error;
  }
};