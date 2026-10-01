export type EmailCategory = "marketing" | "transactional";

export type EmailTemplate = {
  key: string;
  category: EmailCategory;
  subject: (data: Record<string, string>) => string;
  html: (data: Record<string, string>) => string;
  requiredFields?: string[];
};
