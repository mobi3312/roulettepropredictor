
import { GoogleGenAI, Type } from "@google/genai";
import { RouletteNumber } from "../types";

export async function predictNextNumber(history: RouletteNumber[]): Promise<{ number: number; confidence: number }> {
  if (history.length === 0) {
    return { number: Math.floor(Math.random() * 37), confidence: 10 };
  }

  const historyStr = history.map(h => `${h.value} (${h.color})`).join(', ');

  try {
    // Initialisation dynamique pour éviter les problèmes d'API Key au démarrage
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    
    if (!process.env.API_KEY) {
        throw new Error("API_KEY_MISSING");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following sequence of roulette outcomes: [${historyStr}]. 
      Predict the most likely next number (0-36) based on pseudo-patterns, hot/cold analysis, and statistical probabilities. 
      Return a JSON object with the 'number' and a 'confidence' score (1-100).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            number: { type: Type.INTEGER, description: "The predicted number" },
            confidence: { type: Type.INTEGER, description: "Confidence score out of 100" }
          },
          required: ["number", "confidence"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      number: typeof data.number === 'number' ? Math.max(0, Math.min(36, data.number)) : Math.floor(Math.random() * 37),
      confidence: typeof data.confidence === 'number' ? Math.max(0, Math.min(100, data.confidence)) : 15
    };
  } catch (error) {
    console.warn("Gemini Prediction Fallback active:", error);
    // Algorithme de fallback local
    const lastNum = history[0].value;
    const fallbackNum = (lastNum * 3 + 7) % 37;
    return { number: fallbackNum, confidence: 25 };
  }
}
