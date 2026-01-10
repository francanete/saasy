import { tourSteps, type TourStep } from "@/lib/onboarding-config";

describe("onboarding-config", () => {
  describe("tourSteps", () => {
    it("should have at least one step", () => {
      expect(tourSteps.length).toBeGreaterThan(0);
    });

    it("should have unique step ids", () => {
      const ids = tourSteps.map((step) => step.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have unique selectors", () => {
      const selectors = tourSteps.map((step) => step.selector);
      const uniqueSelectors = new Set(selectors);
      expect(uniqueSelectors.size).toBe(selectors.length);
    });

    it("should have valid positions for all steps", () => {
      const validPositions = ["top", "bottom", "left", "right"];
      tourSteps.forEach((step) => {
        expect(validPositions).toContain(step.position);
      });
    });

    it("should have non-empty title and content for all steps", () => {
      tourSteps.forEach((step) => {
        expect(step.title.trim()).not.toBe("");
        expect(step.content.trim()).not.toBe("");
      });
    });

    it("should have selectors that start with # or .", () => {
      tourSteps.forEach((step) => {
        expect(step.selector).toMatch(/^[#.]/);
      });
    });
  });

  describe("step filtering", () => {
    it("should filter desktop-only steps for mobile", () => {
      const mobileSteps = tourSteps.filter((step) => !step.desktopOnly);
      const desktopOnlySteps = tourSteps.filter((step) => step.desktopOnly);

      expect(mobileSteps.length).toBeLessThanOrEqual(tourSteps.length);
      expect(mobileSteps.length + desktopOnlySteps.length).toBe(
        tourSteps.length
      );
    });

    it("should have at least one step available on mobile", () => {
      const mobileSteps = tourSteps.filter((step) => !step.desktopOnly);
      expect(mobileSteps.length).toBeGreaterThan(0);
    });
  });

  describe("TourStep type", () => {
    it("should correctly type a valid step", () => {
      const validStep: TourStep = {
        id: "test",
        title: "Test Step",
        content: "Test content",
        selector: "#test-element",
        position: "bottom",
      };

      expect(validStep.id).toBe("test");
      expect(validStep.desktopOnly).toBeUndefined();
    });

    it("should allow optional desktopOnly property", () => {
      const desktopStep: TourStep = {
        id: "desktop-test",
        title: "Desktop Step",
        content: "Desktop only content",
        selector: "#desktop-element",
        position: "right",
        desktopOnly: true,
      };

      expect(desktopStep.desktopOnly).toBe(true);
    });
  });
});
