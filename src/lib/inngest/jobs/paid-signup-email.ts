import { inngest } from "../client";
import { db, subscriptions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { sendAccountSetupEmail } from "@/lib/email";
import { z } from "zod";

const paidSignupEventSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  email: z.string().email("Invalid email format"),
  name: z.string().nullable(),
});

export const paidSignupEmailJob = inngest.createFunction(
  { id: "send-paid-signup-email" },
  { event: "user/paid-signup" },
  async ({ event, step }) => {
    const parseResult = paidSignupEventSchema.safeParse(event.data);
    if (!parseResult.success) {
      console.error(
        "[send-paid-signup-email] Invalid event data:",
        parseResult.error.flatten()
      );
      throw new Error(
        `Invalid event data: ${parseResult.error.issues.map((i) => i.message).join(", ")}`
      );
    }
    const { userId, email, name } = parseResult.data;

    // Wait briefly for subscription to be created by webhook
    await step.sleep("wait-for-webhook", "1s");

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    const planName = subscription?.plan || "Premium";

    await sendAccountSetupEmail(email, name, planName);

    return { sent: true, plan: planName };
  }
);
