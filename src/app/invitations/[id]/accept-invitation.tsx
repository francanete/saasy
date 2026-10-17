"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function AcceptInvitation({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setPending(true);
    setError(null);
    const result = await authClient.organization.acceptInvitation({
      invitationId,
    });
    setPending(false);
    if (result.error) {
      setError(result.error.message || "Could not accept invitation");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-4">
      <p className="text-muted-foreground">
        Accept the invitation to join your organization’s shared dashboard.
      </p>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <Button onClick={accept} disabled={pending}>
        {pending ? "Joining…" : "Accept invitation"}
      </Button>
    </div>
  );
}
