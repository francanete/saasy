"use server";

import { generateText } from "ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { models, type ModelName } from "@/lib/ai";
import { getSubscriptionStatus } from "@/lib/subscription";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function requireSubscription(): Promise<
  { userId: string } | { error: string }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized" };
  }

  const subscription = await getSubscriptionStatus(session.user.id);
  if (!subscription.hasAccess) {
    return { error: "Active subscription required" };
  }

  return { userId: session.user.id };
}

export async function summarizeText(
  text: string
): Promise<ActionResult<string>> {
  const authResult = await requireSubscription();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const { text: summary } = await generateText({
      model: models.flash,
      prompt: `Summarize the following text in 2-3 sentences:\n\n${text}`,
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
  const authResult = await requireSubscription();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const { text } = await generateText({
      model: models[model],
      prompt,
    });
    return { success: true, data: text };
  } catch (error) {
    console.error("Generation failed:", error);
    return { success: false, error: "Failed to generate content" };
  }
}
