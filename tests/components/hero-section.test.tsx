import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("@/hooks/use-intersection-observer", () => ({
  useIntersectionObserver: () => true,
}));

vi.mock("@/components/hero/hero-dashboard-mockup", () => ({
  HeroDashboardMockup: () => <div data-testid="hero-dashboard-mockup" />,
}));

import { HeroSection } from "@/components/hero/hero-section";
import { appConfig, getGeneralCta } from "@/lib/config";

describe("HeroSection", () => {
  it("renders the general CTA from app access configuration", () => {
    const generalCta = getGeneralCta();

    render(<HeroSection />);

    const cta = screen.getByRole("link", { name: generalCta.label });
    expect(cta).toHaveAttribute("href", generalCta.href);
    expect(cta).toHaveTextContent(generalCta.label);
  });

  it("renders the support copy for the configured access mode", () => {
    render(<HeroSection />);

    const supportCopy = !appConfig.pricing.requirePaidAccess
      ? "Free plan available"
      : appConfig.pricing.allowNativeTrial
        ? `${appConfig.pricing.nativeTrialDays}-day free trial`
        : "Paid plans only";
    expect(screen.getByText(supportCopy)).toBeInTheDocument();
  });
});
