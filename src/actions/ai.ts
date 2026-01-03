"use server";

import { generateText } from "ai";
import { models, type ModelName } from "@/lib/ai";
import { checkAIGenerationRateLimit } from "@/lib/rate-limit";
import { trackAIUsage } from "@/lib/ai-usage";
import { requirePaidAccess } from "@/lib/dal";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; resetAt?: Date };

export async function summarizeText(
  text: string
): Promise<ActionResult<string>> {
  const authResult = await requirePaidAccess();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  // Rate limit check
  const rateLimit = await checkAIGenerationRateLimit(authResult.userId, "pro");

  // Fire-and-forget analytics to Upstash
  rateLimit.pending.catch(() => {});

  if (!rateLimit.success) {
    return {
      success: false,
      error: "Rate limit exceeded. Please wait a moment.",
      resetAt: rateLimit.resetAt,
    };
  }

  try {
    const startTime = Date.now();
    const { text: summary, usage, finishReason } = await generateText({
      model: models.flash,
      prompt: `Summarize the following text in 2-3 sentences:\n\n${text}`,
    });

    // Fire-and-forget token tracking
    trackAIUsage({
      userId: authResult.userId,
      model: "flash",
      feature: "summarize",
      promptTokens: usage.inputTokens ?? 0,
      completionTokens: usage.outputTokens ?? 0,
      totalTokens: usage.totalTokens ?? 0,
      finishReason,
      durationMs: Date.now() - startTime,
    });

    return { success: true, data: summary };
  } catch (error) {
    console.error("Summarization failed:", error);
    return { success: false, error: "Failed to generate summary" };
  }
}

export async function generateContent(
  prompt: string,
  model: ModelName = "flash"
): Promise<ActionResult<string>> {
  const authResult = await requirePaidAccess();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  // Rate limit check
  const rateLimit = await checkAIGenerationRateLimit(authResult.userId, "pro");

  // Fire-and-forget analytics to Upstash
  rateLimit.pending.catch(() => {});

  if (!rateLimit.success) {
    return {
      success: false,
      error: "Rate limit exceeded. Please wait a moment.",
      resetAt: rateLimit.resetAt,
    };
  }

  try {
    const startTime = Date.now();
    const { text, usage, finishReason } = await generateText({
      model: models[model],
      prompt,
    });

    // Fire-and-forget token tracking
    trackAIUsage({
      userId: authResult.userId,
      model,
      feature: "generate",
      promptTokens: usage.inputTokens ?? 0,
      completionTokens: usage.outputTokens ?? 0,
      totalTokens: usage.totalTokens ?? 0,
      finishReason,
      durationMs: Date.now() - startTime,
    });

    return { success: true, data: text };
  } catch (error) {
    console.error("Generation failed:", error);
    return { success: false, error: "Failed to generate content" };
  }
}
