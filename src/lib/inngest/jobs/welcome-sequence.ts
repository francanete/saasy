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

    // onConflictDoNothing handles race conditions from duplicate events
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

    await step.run("track-signup", () =>
      trackEvent("user_signed_up", { profileId: userId, email })
    );

    const user = await step.run("get-user", async () => {
      const [foundUser] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return foundUser;
    });

    if (!user) {
      console.warn(`[welcome-sequence] User ${userId} not found, aborting`);
      return { aborted: true, reason: "user_not_found" };
    }

    const userName = user.name || null;

    const welcomeResult = await step.run("send-welcome-instant", async () => {
      return sendSequenceEmail({
        userId,
        email,
        name: userName,
        emailKey: "welcome_instant",
      });
    });

    await step.sleep("wait-day-3", "3d");

    const day3FollowUpResult = await step.run("send-welcome-day3", async () => {
      return sendSequenceEmail({
        userId,
        email,
        name: userName,
        emailKey: "welcome_day3",
      });
    });

    return {
      welcomeEmail: welcomeResult,
      day3FollowUp: day3FollowUpResult,
    };
  }
);
