import { vi, describe, it, expect, beforeEach } from "vitest";

// ============ Mocks ============
// Must be defined before importing the module under test

const mockFindFirstEmailsSent = vi.fn();
const mockFindFirstUsers = vi.fn();
const mockInsert = vi.fn(() => ({ values: vi.fn() }));
const mockSendEmail = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      emailsSent: {
        findFirst: (...args: unknown[]) => mockFindFirstEmailsSent(...args),
      },
      users: { findFirst: (...args: unknown[]) => mockFindFirstUsers(...args) },
    },
    insert: (...args: unknown[]) => mockInsert(...args),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  users: {
    id: "id",
    email: "email",
    marketingUnsubscribed: "marketingUnsubscribed",
  },
  emailsSent: { userId: "userId", emailKey: "emailKey" },
}));

vi.mock("@/lib/email", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock("@/lib/config", () => ({
  appConfig: { name: "TestApp" },
}));

// Import after mocks are set up
import { sendSequenceEmail } from "@/lib/email-sequences";

// ============ Test Suite ============

describe("sendSequenceEmail", () => {
  const defaultParams = {
    userId: "user-123",
    email: "test@example.com",
    name: "Test User",
    emailKey: "welcome_instant",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variable for templates
    process.env.NEXT_PUBLIC_APP_URL = "https://testapp.com";
  });

  describe("idempotency checks", () => {
    it("returns already_sent when email was previously sent", async () => {
      // Simulate existing email record in database
      mockFindFirstEmailsSent.mockResolvedValue({
        id: "email-1",
        userId: "user-123",
        emailKey: "welcome_instant",
      });

      const result = await sendSequenceEmail(defaultParams);

      expect(result).toEqual({ sent: false, reason: "already_sent" });
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("proceeds when no previous email exists", async () => {
      mockFindFirstEmailsSent.mockResolvedValue(null);
      mockFindFirstUsers.mockResolvedValue({ marketingUnsubscribed: false });

      await sendSequenceEmail(defaultParams);

      expect(mockSendEmail).toHaveBeenCalled();
    });
  });

  describe("user validation", () => {
    it("returns user_not_found when user does not exist", async () => {
      mockFindFirstEmailsSent.mockResolvedValue(null);
      mockFindFirstUsers.mockResolvedValue(null);

      const result = await sendSequenceEmail(defaultParams);

      expect(result).toEqual({ sent: false, reason: "user_not_found" });
      expect(mockSendEmail).not.toHaveBeenCalled();
    });
  });

  describe("unsubscribe handling", () => {
    it("returns unsubscribed when user has opted out of marketing", async () => {
      mockFindFirstEmailsSent.mockResolvedValue(null);
      mockFindFirstUsers.mockResolvedValue({ marketingUnsubscribed: true });

      const result = await sendSequenceEmail(defaultParams);

      expect(result).toEqual({ sent: false, reason: "unsubscribed" });
      expect(mockSendEmail).not.toHaveBeenCalled();
    });
  });

  describe("successful email sending", () => {
    it("sends email and records in database when all checks pass", async () => {
      mockFindFirstEmailsSent.mockResolvedValue(null);
      mockFindFirstUsers.mockResolvedValue({ marketingUnsubscribed: false });

      const result = await sendSequenceEmail(defaultParams);

      expect(result).toEqual({ sent: true });
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          subject: expect.stringContaining("Welcome"),
        })
      );
      expect(mockInsert).toHaveBeenCalled();
    });

    it("replaces {{email}} placeholder with encoded email in unsubscribe link", async () => {
      mockFindFirstEmailsSent.mockResolvedValue(null);
      mockFindFirstUsers.mockResolvedValue({ marketingUnsubscribed: false });

      await sendSequenceEmail(defaultParams);

      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain(encodeURIComponent("test@example.com"));
      expect(emailCall.html).not.toContain("{{email}}");
    });

    it("uses fallback name when name is null", async () => {
      mockFindFirstEmailsSent.mockResolvedValue(null);
      mockFindFirstUsers.mockResolvedValue({ marketingUnsubscribed: false });

      await sendSequenceEmail({ ...defaultParams, name: null });

      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain("there");
    });
  });

  describe("template selection", () => {
    it("uses welcome_day3 template for day 3 emails", async () => {
      mockFindFirstEmailsSent.mockResolvedValue(null);
      mockFindFirstUsers.mockResolvedValue({ marketingUnsubscribed: false });

      await sendSequenceEmail({ ...defaultParams, emailKey: "welcome_day3" });

      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.subject).toContain("How's it going");
    });

    it("returns error for unknown template", async () => {
      mockFindFirstEmailsSent.mockResolvedValue(null);
      mockFindFirstUsers.mockResolvedValue({ marketingUnsubscribed: false });
      vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await sendSequenceEmail({
        ...defaultParams,
        emailKey: "unknown_template",
      });

      expect(result.sent).toBe(false);
    });
  });
});
