import { inngest } from "../client";
import { db, users, subscriptions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { sendSequenceEmail } from "@/lib/email-sequences";
import { trackEvent } from "@/lib/openpanel";
import { z } from "zod";

const userCreatedEventSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  email: z.string().email("Invalid email format"),
});

export const welcomeSequenceJob = inngest.createFunction(
  { id: "welcome-sequence" },
  { event: "user/created" },
  async ({ event, step }) => {
    // Validate event data
    const parseResult = userCreatedEventSchema.safeParse(event.data);
    if (!parseResult.success) {
      console.error(
        "[welcome-sequence] Invalid event data:",
        parseResult.error.flatten()
      );
      throw new Error(
        `Invalid event data: ${parseResult.error.issues.map((i) => i.message).join(", ")}`
      );
    }
    const { userId, email } = parseResult.data;

    // Step 1: Create default FREE subscription for new user
    await step.run("create-subscription", async () => {
      await db
        .insert(subscriptions)
        .values({
          userId,
          plan: "FREE",
          status: "ACTIVE",
          billingType: "none",
        })
        .onConflictDoNothing();
    });

    // Step 2: Track signup event
    await step.run("track-signup", () =>
      trackEvent("user_signed_up", { profileId: userId, email })
    );

    // Step 3: Get user name for emails
    const user = await step.run("get-user", async () => {
      const [u] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return u;
    });

    // Step 4: Send instant welcome email
    const result1 = await step.run("send-welcome-instant", async () => {
      return sendSequenceEmail({
        userId,
        email,
        name: user?.name || null,
        emailKey: "welcome_instant",
      });
    });

    // Step 5: Wait 3 days
    await step.sleep("wait-day-3", "3d");

    // Step 6: Send day 3 follow-up email
    const result2 = await step.run("send-welcome-day3", async () => {
      return sendSequenceEmail({
        userId,
        email,
        name: user?.name || null,
        emailKey: "welcome_day3",
      });
    });

    return {
      email1: result1,
      email2: result2,
    };
  }
);
