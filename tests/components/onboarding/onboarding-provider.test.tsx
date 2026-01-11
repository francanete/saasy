import { render, screen, act, fireEvent } from "@testing-library/react";
import {
  OnboardingProvider,
  useOnboardingContext,
} from "@/components/onboarding/onboarding-provider";
import { onboardingFlows } from "@/lib/onboarding-config";

// Get dashboard flow steps for testing
const dashboardSteps = onboardingFlows.dashboard.steps;

// Mock useIsMobile hook
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(() => false),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper component to access context
function TestConsumer({
  onContext,
}: {
  onContext?: (ctx: ReturnType<typeof useOnboardingContext>) => void;
}) {
  const context = useOnboardingContext();
  onContext?.(context);
  return (
    <div>
      <span data-testid="is-active">{String(context.isActive)}</span>
      <span data-testid="current-step">{context.currentStep}</span>
      <span data-testid="flow-id">{context.flowId ?? "null"}</span>
      <button onClick={() => context.startTour()} data-testid="start-tour">
        Start Tour
      </button>
    </div>
  );
}

// Create mock DOM elements for tour targets
function setupTourTargets() {
  dashboardSteps.forEach((step) => {
    const element = document.createElement("div");
    element.id = step.selector.replace("#", "");
    element.setAttribute("data-testid", step.id);
    document.body.appendChild(element);
  });
}

function cleanupTourTargets() {
  dashboardSteps.forEach((step) => {
    const element = document.querySelector(step.selector);
    element?.remove();
  });
}

describe("OnboardingProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    setupTourTargets();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanupTourTargets();
    vi.useRealTimers();
  });

  describe("context", () => {
    it("throws when useOnboardingContext is used outside provider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow("useOnboardingContext must be used within OnboardingProvider");

      consoleSpy.mockRestore();
    });

    it("provides context values within provider", () => {
      render(
        <OnboardingProvider flowId="dashboard" flowCompleted={true}>
          <TestConsumer />
        </OnboardingProvider>
      );

      expect(screen.getByTestId("is-active")).toHaveTextContent("false");
      expect(screen.getByTestId("current-step")).toHaveTextContent("0");
      expect(screen.getByTestId("flow-id")).toHaveTextContent("null");
    });
  });

  describe("auto-start behavior", () => {
    it("auto-starts tour for users who have not completed the flow", async () => {
      render(
        <OnboardingProvider flowId="dashboard" flowCompleted={false}>
          <TestConsumer />
        </OnboardingProvider>
      );

      // Initially inactive
      expect(screen.getByTestId("is-active")).toHaveTextContent("false");

      // Advance timer to trigger auto-start (500ms delay)
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(screen.getByTestId("is-active")).toHaveTextContent("true");
      expect(screen.getByTestId("flow-id")).toHaveTextContent("dashboard");
    });

    it("does not auto-start for users who completed the flow", async () => {
      render(
        <OnboardingProvider flowId="dashboard" flowCompleted={true}>
          <TestConsumer />
        </OnboardingProvider>
      );

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByTestId("is-active")).toHaveTextContent("false");
    });
  });

  describe("manual tour control", () => {
    it("starts tour when startTour is called", async () => {
      render(
        <OnboardingProvider flowId="dashboard" flowCompleted={true}>
          <TestConsumer />
        </OnboardingProvider>
      );

      expect(screen.getByTestId("is-active")).toHaveTextContent("false");

      await act(async () => {
        fireEvent.click(screen.getByTestId("start-tour"));
      });

      expect(screen.getByTestId("is-active")).toHaveTextContent("true");
      expect(screen.getByTestId("current-step")).toHaveTextContent("0");
      expect(screen.getByTestId("flow-id")).toHaveTextContent("dashboard");
    });
  });

  describe("flow-specific behavior", () => {
    it("tracks the active flow ID", async () => {
      render(
        <OnboardingProvider flowId="dashboard" flowCompleted={false}>
          <TestConsumer />
        </OnboardingProvider>
      );

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(screen.getByTestId("flow-id")).toHaveTextContent("dashboard");
    });
  });
});

describe("useOnboardingContext", () => {
  it("returns isActive, currentStep, flowId, and startTour", () => {
    let contextValue: ReturnType<typeof useOnboardingContext> | null = null;

    render(
      <OnboardingProvider flowId="dashboard" flowCompleted={true}>
        <TestConsumer
          onContext={(ctx) => {
            contextValue = ctx;
          }}
        />
      </OnboardingProvider>
    );

    expect(contextValue).not.toBeNull();
    expect(contextValue).toHaveProperty("isActive");
    expect(contextValue).toHaveProperty("currentStep");
    expect(contextValue).toHaveProperty("flowId");
    expect(contextValue).toHaveProperty("startTour");
    expect(typeof contextValue!.startTour).toBe("function");
  });
});
