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

    const cta = screen.getByRole("link", { name: /start free trial/i });
    expect(cta).toHaveAttribute("href", generalCta.href);
    expect(cta).toHaveTextContent(generalCta.label);
  });

  it("renders native-trial support copy when native trial is enabled", () => {
    render(<HeroSection />);

    expect(
      screen.getByText(`${appConfig.pricing.nativeTrialDays}-day free trial`)
    ).toBeInTheDocument();
  });
});
