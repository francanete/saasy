import { welcomeSequenceJob } from "./jobs/welcome-sequence";
import { syncAllSubscriptions } from "./jobs/sync-all-subscriptions";
import { paidSignupEmailJob } from "./jobs/paid-signup-email";
import { trialEndingReminderJob } from "./jobs/trial-ending-reminder";

export {
  welcomeSequenceJob,
  syncAllSubscriptions,
  paidSignupEmailJob,
  trialEndingReminderJob,
};

export {
  trialEndingReminderHandler,
  type InngestStepLike,
} from "./jobs/trial-ending-reminder";

export const functions = [
  welcomeSequenceJob,
  syncAllSubscriptions,
  paidSignupEmailJob,
  trialEndingReminderJob,
];
