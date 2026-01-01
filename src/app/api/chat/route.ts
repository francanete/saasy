import { models, type ModelName } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSubscriptionStatus } from "@/lib/subscription";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check subscription - AI requires active subscription
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

  // Convert messages to Gemini format (role: "user" | "model", parts: [{text}])
  const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1].content;

  const chat = models[model as ModelName].startChat({ history });
  const result = await chat.sendMessageStream(lastMessage);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
        );
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
