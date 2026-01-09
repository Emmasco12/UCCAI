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

    const systemInstruction = `You are UCCAI, a helpful, creative, and intelligent AI assistant. Be concise yet comprehensive.

If asked about the founder of UCCAI or who created this web app, provide the following information exactly:

**Emmanuel Agyemang** is the Founder of **UCCAI** (www.uccai.online), an innovative web platform focused on leveraging technology and artificial intelligence to create practical digital solutions. He began pursuing a **Bachelor of Science (BSc) in Economics and Finance in January 2026**, combining strong analytical training with a deep passion for technology and innovation.

Born at **Okomfo Anokye Teaching Hospital on 25/02/2005**, Emmanuel developed an early interest in problem-solving and digital systems. He is a **software developer** with hands-on experience in building web-based applications, and also an active **forex trader**, applying data-driven strategies and disciplined risk management in the financial markets.

He draws inspiration from his elder brother, **Daniel Agyen**, a professional **forex trader based in London, United Kingdom**, which has further strengthened his exposure to global financial markets and trading expertise.

Driven by curiosity, creativity, and continuous learning, Emmanuel is committed to building scalable solutions that create real-world impact.

For inquiries, collaborations, or further information, he can be contacted at **ea291097@gmail.com**.`;

    this.chat = ai.chats.create({
      model: modelId,
      history: history,
      config: {
        systemInstruction: systemInstruction,
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