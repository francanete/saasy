import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/config", () => ({
  appConfig: { name: "TestApp" },
}));

import {
  getMarketingTemplate,
  getTransactionalTemplate,
  getAllTemplates,
} from "@/lib/emails";

describe("email registry", () => {
  it("discovers all templates", () => {
    const templates = getAllTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(3);
  });

  it("has unique keys across all templates", () => {
    const templates = getAllTemplates();
    const keys = templates.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("returns marketing template by key", () => {
    const template = getMarketingTemplate("welcome_instant");
    expect(template).toBeDefined();
    expect(template!.category).toBe("marketing");
  });

  it("returns transactional template by key", () => {
    const template = getTransactionalTemplate("trial_ending_24h");
    expect(template).toBeDefined();
    expect(template!.category).toBe("transactional");
  });

  it("returns undefined for wrong category lookup", () => {
    expect(getMarketingTemplate("trial_ending_24h")).toBeUndefined();
    expect(getTransactionalTemplate("welcome_instant")).toBeUndefined();
  });

  it("returns undefined for unknown key", () => {
    expect(getMarketingTemplate("nonexistent")).toBeUndefined();
    expect(getTransactionalTemplate("nonexistent")).toBeUndefined();
  });

  it("renders native trial copy without automatic billing claims", () => {
    const template = getTransactionalTemplate("trial_ending_24h");
    const html = template!.html({
      name: "Test User",
      planName: "Starter",
      endDate: "January 15, 2025",
    });

    expect(template!.requiredFields).toEqual(["planName", "endDate"]);
    expect(html).toContain("choose a plan and complete checkout");
    expect(html).not.toContain("automatically charged");
    expect(html).not.toContain("automatically start");
  });
});
