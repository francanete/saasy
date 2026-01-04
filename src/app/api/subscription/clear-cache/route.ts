import { getCurrentSession } from "@/lib/dal";
import { clearFeatureLimitCache } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  // Clear rate limit config cache - new tier limits apply immediately
  clearFeatureLimitCache();

  return NextResponse.json({ success: true });
}
