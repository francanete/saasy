import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
});

// Model configurations for Vercel AI SDK
export const models = {
  // Fast model for quick responses (chat, summaries)
  flash: google("gemini-1.5-flash"),
  // More capable model for complex reasoning
  pro: google("gemini-1.5-pro"),
};

export type ModelName = keyof typeof models;
