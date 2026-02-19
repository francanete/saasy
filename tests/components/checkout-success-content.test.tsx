import { vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";

const mockSyncSubscriptionAction = vi.fn();

vi.mock("@/actions/subscription", () => ({
  syncSubscriptionAction: (...args: unknown[]) =>
    mockSyncSubscriptionAction(...args),
}));

let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

import { CheckoutSuccessContent } from "@/components/checkout-success-content";

describe("CheckoutSuccessContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("shows loading spinner initially", async () => {
    // Never resolve so we stay in loading state
    mockSyncSubscriptionAction.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      render(<CheckoutSuccessContent />);
    });

    expect(screen.getByText("Confirming your payment...")).toBeInTheDocument();
  });

  it("shows 'Go to Dashboard' on success", async () => {
    mockSyncSubscriptionAction.mockResolvedValue({
      success: true,
      canAccessDashboard: true,
    });

    await act(async () => {
      render(<CheckoutSuccessContent />);
    });

    // Wait for async effect
    await act(async () => {
      await vi.waitFor(() => {
        expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
      });
    });
  });

  it("shows 'Check Again' button in processing state", async () => {
    mockSyncSubscriptionAction.mockResolvedValue({
      success: true,
      canAccessDashboard: false,
    });

    await act(async () => {
      render(<CheckoutSuccessContent />);
    });

    await act(async () => {
      await vi.waitFor(() => {
        expect(screen.getByText("Check Again")).toBeInTheDocument();
      });
    });
  });

  it("passes customer_session_token from URL to action", async () => {
    mockSearchParams = new URLSearchParams(
      "customer_session_token=tok-xyz-123"
    );
    mockSyncSubscriptionAction.mockResolvedValue({
      success: true,
      canAccessDashboard: true,
    });

    await act(async () => {
      render(<CheckoutSuccessContent />);
    });

    await act(async () => {
      await vi.waitFor(() => {
        expect(mockSyncSubscriptionAction).toHaveBeenCalledWith("tok-xyz-123");
      });
    });
  });

  it("'Check Again' button re-triggers sync", async () => {
    mockSyncSubscriptionAction.mockResolvedValue({
      success: true,
      canAccessDashboard: false,
    });

    await act(async () => {
      render(<CheckoutSuccessContent />);
    });

    await act(async () => {
      await vi.waitFor(() => {
        expect(screen.getByText("Check Again")).toBeInTheDocument();
      });
    });

    // Now resolve with success on second call
    mockSyncSubscriptionAction.mockResolvedValue({
      success: true,
      canAccessDashboard: true,
    });

    fireEvent.click(screen.getByText("Check Again"));

    await act(async () => {
      await vi.waitFor(() => {
        expect(mockSyncSubscriptionAction).toHaveBeenCalledTimes(2);
      });
    });
  });
});
