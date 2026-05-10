/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export const generateRecipeImage = async (title: string, description: string): Promise<string> => {
  // Check for API key selection
  const hasKey = await window.aistudio.hasSelectedApiKey();
  if (!hasKey) {
    await window.aistudio.openSelectKey();
    // After selection, the key is available in process.env.API_KEY
  }

  // Create a new instance right before the call to ensure it uses the correct key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
  
  const prompt = `A professional food photography shot of ${title}. ${description}. High resolution, appetizing, 4k, gourmet styling.`;
  
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64EncodeString = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64EncodeString}`;
    }
    throw new Error('No images generated');
  } catch (error) {
    console.error('Error generating image:', error);
    if (error instanceof Error && error.message.includes("Requested entity was not found")) {
      // Prompt the user to select a key again if it fails
      await window.aistudio.openSelectKey();
    }
    throw error;
  }
};
