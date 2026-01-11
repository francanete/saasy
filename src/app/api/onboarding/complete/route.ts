import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { onboardingFlows } from "@/lib/db/schema";
import { getCurrentSession } from "@/lib/dal";
import { handleApiError } from "@/lib/api-utils";
import { createId } from "@paralleldrive/cuid2";

const requestSchema = z.object({
  flowId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { flowId } = requestSchema.parse(body);

    // Upsert: insert if not exists, update if exists
    await db
      .insert(onboardingFlows)
      .values({
        id: createId(),
        userId: session.user.id,
        flowId,
        completedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [onboardingFlows.userId, onboardingFlows.flowId],
        set: {
          completedAt: new Date(),
          skippedAt: null, // Clear skipped if completing
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to complete onboarding", {
      userId: session.user.id,
      error,
    });
    return handleApiError(error);
  }
}
