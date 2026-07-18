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

  it("shows payment success only when payment is confirmed", async () => {
    mockSyncSubscriptionAction.mockResolvedValue({
      success: true,
      paymentConfirmed: true,
    });

    await act(async () => {
      render(<CheckoutSuccessContent customerSessionToken="tok-xyz-123" />);
    });

    await act(async () => {
      await vi.waitFor(() => {
        expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
      });
    });

    expect(screen.getByText("Payment Successful!")).toBeInTheDocument();
    expect(
      screen.queryByText("Already have an account?")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Check your email")).not.toBeInTheDocument();
  });

  it("does not claim payment succeeded when payment is unconfirmed", async () => {
    mockSyncSubscriptionAction.mockResolvedValue({
      success: true,
      paymentConfirmed: false,
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
      screen.getByText("Payment confirmation pending")
    ).toBeInTheDocument();
    expect(screen.queryByText("Payment Successful!")).not.toBeInTheDocument();
    expect(screen.queryByText("Payment Received!")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Already have an account?")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Check your email")).not.toBeInTheDocument();
  });

  it("keeps tokenless checkout pending when retries find no payment", async () => {
    vi.useFakeTimers();
    mockSyncSubscriptionAction.mockResolvedValue({
      success: true,
      paymentConfirmed: false,
    });

    try {
      await act(async () => {
        render(<CheckoutSuccessContent />);
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(mockSyncSubscriptionAction).toHaveBeenCalledTimes(5);
      expect(
        screen.getByText("Payment confirmation pending")
      ).toBeInTheDocument();
      expect(screen.queryByText("Payment Successful!")).not.toBeInTheDocument();
      expect(screen.queryByText("Payment Received!")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("passes customerSessionToken to action", async () => {
    mockSyncSubscriptionAction.mockResolvedValue({
      success: true,
      paymentConfirmed: true,
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
      paymentConfirmed: false,
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
      paymentConfirmed: true,
    });

    fireEvent.click(screen.getByText("Check Again"));

    await act(async () => {
      await vi.waitFor(() => {
        expect(mockSyncSubscriptionAction).toHaveBeenCalledTimes(2);
      });
    });
  });
});
