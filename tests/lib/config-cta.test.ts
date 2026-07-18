import { describe, expect, it } from "vitest";
import { getGeneralCta, type AppConfig, appConfig } from "@/lib/config";

function makeConfig(overrides: Partial<AppConfig["pricing"]>): AppConfig {
  return {
    ...appConfig,
    pricing: {
      ...appConfig.pricing,
      ...overrides,
    },
  };
}

describe("getGeneralCta", () => {
  it("returns Get Started when free access is allowed", () => {
    expect(
      getGeneralCta(
        makeConfig({ requirePaidAccess: false, allowNativeTrial: false })
      )
    ).toEqual({ label: "Get Started", href: "/signup" });
  });

  it("returns Start Free Trial when paid access is required and native trial is enabled", () => {
    expect(
      getGeneralCta(
        makeConfig({ requirePaidAccess: true, allowNativeTrial: true })
      )
    ).toEqual({ label: "Start Free Trial", href: "/signup" });
  });

  it("returns Choose Plan when paid access is required and native trial is disabled", () => {
    expect(
      getGeneralCta(
        makeConfig({ requirePaidAccess: true, allowNativeTrial: false })
      )
    ).toEqual({ label: "Choose Plan", href: "/pricing" });
  });
});
