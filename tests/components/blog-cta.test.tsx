import { render, screen } from "@testing-library/react";
import { BlogCta } from "@/components/blog/blog-cta";
import { getGeneralCta } from "@/lib/config";

describe("BlogCta", () => {
  it("renders the general CTA from app access configuration", () => {
    const generalCta = getGeneralCta();

    render(<BlogCta />);

    const cta = screen.getByRole("link", { name: generalCta.label });
    expect(cta).toHaveAttribute("href", generalCta.href);
    expect(cta).toHaveTextContent(generalCta.label);
  });
});
