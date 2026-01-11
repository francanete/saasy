import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Unsubscribe a user from marketing emails.
 * GET /api/unsubscribe?email=xxx
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.redirect(
      new URL("/unsubscribe?error=missing-email", request.url)
    );
  }

  try {
    // Decode email (was URL encoded in the link)
    const decodedEmail = decodeURIComponent(email);

    // Update user's marketing preference
    const result = await db
      .update(users)
      .set({ marketingUnsubscribed: true })
      .where(eq(users.email, decodedEmail))
      .returning({ id: users.id });

    if (result.length === 0) {
      return NextResponse.redirect(
        new URL("/unsubscribe?error=not-found", request.url)
      );
    }

    return NextResponse.redirect(
      new URL("/unsubscribe?success=true", request.url)
    );
  } catch (error) {
    console.error("[Unsubscribe] Error:", error);
    return NextResponse.redirect(
      new URL("/unsubscribe?error=server-error", request.url)
    );
  }
}
