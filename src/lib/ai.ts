import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// Use stable model versions for production reliability
// Experimental models (gemini-2.0-flash-exp, etc.) may be deprecated without notice
export const models = {
  // Fast model for quick responses (chat, summaries)
  flash: genAI.getGenerativeModel({ model: "gemini-1.5-flash" }),
  // More capable model for complex reasoning
  pro: genAI.getGenerativeModel({ model: "gemini-1.5-pro" }),
};

// Model selection helper
export type ModelName = keyof typeof models;

export { genAI };
