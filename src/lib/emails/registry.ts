import type { EmailTemplate } from "./types";

// Import all templates
import { template as welcomeInstant } from "./templates/marketing/welcome-instant";
import { template as welcomeDay3 } from "./templates/marketing/welcome-day3";
import { template as trialEnding24h } from "./templates/transactional/trial-ending-24h";

const allTemplates: EmailTemplate[] = [
  welcomeInstant,
  welcomeDay3,
  trialEnding24h,
];

const templateMap = new Map<string, EmailTemplate>(
  allTemplates.map((t) => [t.key, t])
);

export function getMarketingTemplate(key: string): EmailTemplate | undefined {
  const template = templateMap.get(key);
  return template?.category === "marketing" ? template : undefined;
}

export function getTransactionalTemplate(
  key: string
): EmailTemplate | undefined {
  const template = templateMap.get(key);
  return template?.category === "transactional" ? template : undefined;
}

export function getAllTemplates(): EmailTemplate[] {
  return allTemplates;
}
