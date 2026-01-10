import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentSession } from "@/lib/dal";

export async function POST() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db
    .update(users)
    .set({
      onboardingCompleted: true,
      onboardingSkippedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return Response.json({ success: true });
}
