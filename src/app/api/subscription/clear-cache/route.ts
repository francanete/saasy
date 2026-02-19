import { requireAdminAccess, AuthError } from "@/lib/dal";
import { clearAILimitCache } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await requireAdminAccess();
  } catch (error) {
    const status =
      error instanceof AuthError && error.message === "Unauthorized"
        ? 401
        : 403;
    return NextResponse.json(
      { error: "Admin access required", code: "FORBIDDEN" },
      { status }
    );
  }

  // Clear rate limit config cache - new tier limits apply immediately
  clearAILimitCache();

  return NextResponse.json({ success: true });
}
