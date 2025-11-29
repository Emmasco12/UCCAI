import { GoogleGenAI, Chat, Content, Part } from "@google/genai";
import { ChatMessage, Role } from "../types";

// Ensure API Key is present. In a real app, this might be handled more gracefully, 
// but per instructions, we assume process.env.API_KEY is available and valid.
const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

// System instruction to define the persona
const SYSTEM_INSTRUCTION = "You are UCCAI, a helpful, witty, and knowledgeable AI assistant. You provide clear, concise, and accurate answers. You can help with coding, writing, analysis, and general questions. Your tone is professional yet conversational.";

export class GeminiService {
  private chatSession: Chat | null = null;
  private modelName: string = 'gemini-2.5-flash';

  constructor() {
    // Initializing with empty history
    this.initChat();
  }

  // Allow initializing with specific history
  public initChat(history: ChatMessage[] = []) {
    try {
      // Convert internal ChatMessage format to Gemini SDK Content format
      const sdkHistory: Content[] = history.map(msg => ({
        role: msg.role === Role.User ? 'user' : 'model',
        parts: [{ text: msg.text } as Part]
      }));

      this.chatSession = ai.chats.create({
        model: this.modelName,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
        history: sdkHistory
      });
    } catch (error) {
      console.error("Failed to initialize chat session:", error);
    }
  }

  public resetChat() {
    this.initChat([]);
  }

  public async *sendMessageStream(message: string): AsyncGenerator<string, void, unknown> {
    if (!this.chatSession) {
      this.initChat();
    }

    if (!this.chatSession) {
      throw new Error("Chat session could not be initialized.");
    }

    try {
      const result = await this.chatSession.sendMessageStream({ message });

      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          yield text;
        }
      }
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      throw error;
    }
  }
}

// Singleton instance
export const geminiService = new GeminiService();