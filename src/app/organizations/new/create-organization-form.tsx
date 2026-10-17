"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateOrganizationForm({
  hasPendingInvitations = false,
}: {
  hasPendingInvitations?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editingSlug, setEditingSlug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  function normalizeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await authClient.organization.create({
      name: name.trim(),
      slug: normalizeSlug(slug),
    });
    setPending(false);

    if (result.error) {
      setError(result.error.message || "Could not create organization");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="organization-name">Organization name</Label>
        <Input
          id="organization-name"
          value={name}
          onChange={(event) => {
            const next = event.target.value;
            setName(next);
            if (!editingSlug) setSlug(normalizeSlug(next));
          }}
          placeholder="Acme Ltd"
          required
          maxLength={80}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="organization-slug">Organization URL name</Label>
        <Input
          id="organization-slug"
          value={slug}
          onChange={(event) => {
            setEditingSlug(true);
            setSlug(normalizeSlug(event.target.value));
          }}
          placeholder="acme-ltd"
          required
          maxLength={80}
        />
      </div>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      {hasPendingInvitations && (
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-1"
          />
          <span>
            I want to create a separate organization instead of joining one of
            my invitations now.
          </span>
        </label>
      )}
      <Button
        disabled={
          pending ||
          !name.trim() ||
          !slug ||
          (hasPendingInvitations && !confirmed)
        }
        type="submit"
      >
        {pending ? "Creating…" : "Create organization"}
      </Button>
    </form>
  );
}
