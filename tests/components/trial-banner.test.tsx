import { render, screen } from "@testing-library/react";
import { TrialBanner } from "@/components/trial-banner";

describe("TrialBanner", () => {
  it("routes the upgrade action to pricing", () => {
    render(<TrialBanner endsAt={new Date("2030-01-01T00:00:00.000Z")} />);

    expect(screen.getByRole("link", { name: /upgrade now/i })).toHaveAttribute(
      "href",
      "/pricing"
    );
  });
});
