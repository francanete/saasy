"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinInvitedOrganization } from "@/actions/organization";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function RecoverInvitation({
  invitationId,
  currentOrganizationName,
  invitedOrganizationName,
}: {
  invitationId: string;
  currentOrganizationName: string;
  invitedOrganizationName: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setPending(true);
    setError(null);
    try {
      const result = await joinInvitedOrganization(invitationId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      try {
        await authClient.organization.setActive({
          organizationId: result.organizationId,
        });
      } catch {
        // The server action has already updated the user's sessions.
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not check the invitation. Refresh and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <p>
        Your current organization, <strong>{currentOrganizationName}</strong>,
        is empty. Joining <strong>{invitedOrganizationName}</strong> will remove
        it and its local trial.
      </p>
      <p className="text-muted-foreground text-sm">
        We will check Polar for purchases or active checkouts before making any
        change.
      </p>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <Button onClick={join} disabled={pending}>
        {pending
          ? "Checking and joining…"
          : `Remove ${currentOrganizationName} and join`}
      </Button>
    </div>
  );
}
