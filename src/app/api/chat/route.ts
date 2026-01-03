import { streamText } from "ai";
import { models, type ModelName } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSubscriptionStatus } from "@/lib/subscription";
import { checkAIChatRateLimit } from "@/lib/rate-limit";
import { trackAIUsage } from "@/lib/ai-usage";
import { handleApiError } from "@/lib/api-utils";
import {
  UnauthorizedError,
  ForbiddenError,
  RateLimitError,
  BadRequestError,
} from "@/lib/errors";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Server-side system prompt (never sent from client)
const SYSTEM_PROMPT = `You are a helpful assistant for Saasy, a SaaS application.

PRICING:
- Free plan: Up to 3 projects, basic analytics, community support
- Pro Monthly: $19/month - Unlimited projects, advanced analytics, priority support
- Pro Annual: $190/year (save 17%)

SUPPORT:
- Free users: Community support
- Pro users: Priority email support

Be helpful, concise, and friendly.`;

export async function POST(req: Request) {
  try {
    // 1. Auth check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      throw new UnauthorizedError();
    }

    // 2. Subscription check - AI requires active subscription
    const subscription = await getSubscriptionStatus(session.user.id);
    if (!subscription.hasAccess) {
      throw new ForbiddenError("Active subscription required to use AI features");
    }

    // 3. Rate limit check
    const tier = subscription.hasAccess ? "pro" : "free";
    const rateLimit = await checkAIChatRateLimit(session.user.id, tier);

    // Fire-and-forget analytics to Upstash
    rateLimit.pending.catch(() => {});

    if (!rateLimit.success) {
      throw new RateLimitError(
        "Too many requests. Please wait a moment.",
        rateLimit.resetAt,
        rateLimit.remaining
      );
    }

    // 4. Parse request (ignore client system prompt for security)
    const { messages, model = "flash" } = await req.json();

    // 5. Validate model name
    if (!(model in models)) {
      throw new BadRequestError("Invalid model");
    }

    // 6. Convert UIMessage format (parts) to ModelMessage format (content)
    const modelMessages = messages.map(
      (msg: {
        role: string;
        parts?: { type: string; text: string }[];
        content?: string;
      }) => ({
        role: msg.role,
        content:
          msg.parts
            ?.filter((p) => p.type === "text")
            .map((p) => p.text)
            .join("") ??
          msg.content ??
          "",
      })
    );

    // 7. Stream with token tracking
    const startTime = Date.now();
    const result = streamText({
      model: models[model as ModelName],
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      onFinish: async ({ usage, finishReason }) => {
        // Fire-and-forget token tracking
        await trackAIUsage({
          userId: session.user.id,
          model: model as ModelName,
          feature: "chat",
          promptTokens: usage.inputTokens ?? 0,
          completionTokens: usage.outputTokens ?? 0,
          totalTokens: usage.totalTokens ?? 0,
          finishReason,
          durationMs: Date.now() - startTime,
        });
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
