import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { ModelId, GroundingMetadata } from "../types";

// Helper to get the AI instance
const getAIInstance = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing in process.env");
    throw new Error("API Key is missing. Please check your configuration.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export interface StreamUpdate {
  text?: string;
  groundingMetadata?: GroundingMetadata;
}

export class GeminiService {
  private chat: Chat | null = null;
  private currentModelId: ModelId | null = null;

  async startChat(modelId: ModelId, history: { role: string; parts: { text: string }[] }[] = [], isThinkingEnabled: boolean = false, isSearchEnabled: boolean = false) {
    const ai = getAIInstance();
    
    const thinkingConfig = isThinkingEnabled ? {
        thinkingConfig: { thinkingBudget: 16000 }
    } : undefined;

    const tools = isSearchEnabled ? [{ googleSearch: {} }] : undefined;

    this.chat = ai.chats.create({
      model: modelId,
      history: history,
      config: {
        systemInstruction: "You are UCCAI, a helpful, creative, and intelligent AI assistant. Be concise yet comprehensive.",
        ...thinkingConfig,
        tools: tools,
      },
    });
    this.currentModelId = modelId;
  }

  async *sendMessageStream(message: string): AsyncGenerator<StreamUpdate, void, unknown> {
    if (!this.chat) {
      throw new Error("Chat session not initialized.");
    }

    try {
      const result = await this.chat.sendMessageStream({ message });

      for await (const chunk of result) {
        const responseChunk = chunk as GenerateContentResponse;
        
        const update: StreamUpdate = {};

        if (responseChunk.text) {
          update.text = responseChunk.text;
        }
        
        // Check for grounding metadata in candidates
        if (responseChunk.candidates?.[0]?.groundingMetadata) {
          update.groundingMetadata = responseChunk.candidates[0].groundingMetadata as GroundingMetadata;
        }

        if (update.text || update.groundingMetadata) {
            yield update;
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();