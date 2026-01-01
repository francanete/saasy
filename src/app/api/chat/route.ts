import { streamText } from "ai";
import { models, type ModelName } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSubscriptionStatus } from "@/lib/subscription";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  // Auth check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Subscription check - AI requires active subscription
  const subscription = await getSubscriptionStatus(session.user.id);
  if (!subscription.hasAccess) {
    return Response.json(
      { error: "Active subscription required to use AI features" },
      { status: 403 }
    );
  }

  const { messages, model = "flash" } = await req.json();

  // Validate model name
  if (!(model in models)) {
    return Response.json({ error: "Invalid model" }, { status: 400 });
  }

  const result = streamText({
    model: models[model as ModelName],
    messages,
  });

  return result.toUIMessageStreamResponse();
}
