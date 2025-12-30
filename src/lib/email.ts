import { appConfig } from "./config";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
  // Skip sending if no API key (development without Resend)
  if (!process.env.RESEND_API_KEY) {
    console.log("[Email] Skipping send (no RESEND_API_KEY):", { to, subject });
    return { id: "dev-mode" };
  }

  // Lazy-load Resend to avoid instantiation at module load time
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: from || appConfig.email.from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });

  if (error) {
    console.error("Email send error:", error);
    throw error;
  }

  return data;
}
