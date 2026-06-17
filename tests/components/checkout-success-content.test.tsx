import { vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";

const mockSyncSubscriptionAction = vi.fn();

vi.mock("@/actions/subscription", () => ({
  syncSubscriptionAction: (...args: unknown[]) =>
    mockSyncSubscriptionAction(...args),
}));

import { CheckoutSuccessContent } from "@/components/checkout-success-content";

describe("CheckoutSuccessContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner initially", async () => {
    mockSyncSubscriptionAction.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      render(<CheckoutSuccessContent />);
    });

    expect(screen.getByText("Confirming your payment...")).toBeInTheDocument();
  });

  it("shows 'Go to Dashboard' on success with token", async () => {
    mockSyncSubscriptionAction.mockResolvedValue({
      success: true,
      canAccessDashboard: true,
    });

    await act(async () => {
      render(<CheckoutSuccessContent customerSessionToken="tok-xyz-123" />);
    });

    await act(async () => {
      await vi.waitFor(() => {
        expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
      });
    });

    expect(
      screen.queryByText("Already have an account?")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Check your email")).not.toBeInTheDocument();
  });

  it("shows 'Check Again' button in processing state", async () => {
    mockSyncSubscriptionAction.mockResolvedValue({
      success: true,
      canAccessDashboard: false,
    });

    await act(async () => {
      render(<CheckoutSuccessContent customerSessionToken="tok-xyz-123" />);
    });

    await act(async () => {
      await vi.waitFor(() => {
        expect(screen.getByText("Check Again")).toBeInTheDocument();
      });
    });

    expect(
      screen.queryByText("Already have an account?")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Check your email")).not.toBeInTheDocument();
  });

  it("passes customerSessionToken to action", async () => {
    mockSyncSubscriptionAction.mockResolvedValue({
      success: true,
      canAccessDashboard: true,
    });

    await act(async () => {
      render(<CheckoutSuccessContent customerSessionToken="tok-xyz-123" />);
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
      render(<CheckoutSuccessContent customerSessionToken="tok-xyz-123" />);
    });

    await act(async () => {
      await vi.waitFor(() => {
        expect(screen.getByText("Check Again")).toBeInTheDocument();
      });
    });

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
