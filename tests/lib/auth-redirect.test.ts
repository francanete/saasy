import { describe, expect, it } from "vitest";
import { getSafeAuthCallback } from "@/lib/auth-redirect";

describe("getSafeAuthCallback", () => {
  it("defaults to the dashboard", () => {
    expect(getSafeAuthCallback()).toBe("/dashboard");
  });

  it("preserves a checkout continuation callback", () => {
    expect(getSafeAuthCallback("/checkout/continue?slug=starter-monthly")).toBe(
      "/checkout/continue?slug=starter-monthly"
    );
  });

  it("rejects external callback URLs", () => {
    expect(getSafeAuthCallback("https://example.com/steal")).toBe("/dashboard");
    expect(getSafeAuthCallback("//example.com/steal")).toBe("/dashboard");
  });

  it("rejects unsupported internal callback paths", () => {
    expect(getSafeAuthCallback("/pricing")).toBe("/dashboard");
  });
});
