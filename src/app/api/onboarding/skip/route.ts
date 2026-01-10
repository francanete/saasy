import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentSession } from "@/lib/dal";
import { handleApiError } from "@/lib/api-utils";

export async function POST() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  try {
    await db
      .update(users)
      .set({
        onboardingCompleted: true,
        onboardingSkippedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to skip onboarding", {
      userId: session.user.id,
      error,
    });
    return handleApiError(error);
  }
}
