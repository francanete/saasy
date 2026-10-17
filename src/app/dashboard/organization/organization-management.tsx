"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { OrganizationRole } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MemberRow = {
  id: string;
  userId: string;
  role: string;
  name: string | null;
  email: string;
};

type InvitationRow = {
  id: string;
  email: string;
  role: string | null;
  status: string;
};

export function OrganizationManagement({
  organizationId,
  currentUserId,
  role,
  members,
  invitations,
}: {
  organizationId: string;
  currentUserId: string;
  role: OrganizationRole;
  members: MemberRow[];
  invitations: InvitationRow[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canInvite = role === "owner" || role === "admin";

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await authClient.organization.inviteMember({
      organizationId,
      email: email.trim(),
      role: inviteRole,
    });
    setPending(false);
    if (result.error) {
      setError(result.error.message || "Could not send invitation");
      return;
    }
    setEmail("");
    setMessage("Invitation sent.");
    router.refresh();
  }

  async function changeRole(memberId: string, nextRole: "admin" | "member") {
    setError(null);
    const result = await authClient.organization.updateMemberRole({
      organizationId,
      memberId,
      role: nextRole,
    });
    if (result.error) {
      setError(result.error.message || "Could not update role");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-4 border-b pb-3 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {member.name || member.email}
                </p>
                <p className="text-muted-foreground truncate text-sm">
                  {member.email}
                </p>
              </div>
              {role === "owner" &&
              member.userId !== currentUserId &&
              member.role !== "owner" ? (
                <select
                  aria-label={`Role for ${member.email}`}
                  className="border-input bg-background rounded-md border px-2 py-1 text-sm"
                  value={member.role}
                  onChange={(event) =>
                    changeRole(
                      member.id,
                      event.target.value as "admin" | "member"
                    )
                  }
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              ) : (
                <span className="text-muted-foreground text-sm capitalize">
                  {member.role}
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {canInvite && (
            <form onSubmit={invite} className="space-y-3">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="colleague@example.com"
              />
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={inviteRole}
                onChange={(event) =>
                  setInviteRole(event.target.value as "admin" | "member")
                }
              >
                <option value="member">Member — view shared dashboard</option>
                <option value="admin">Admin — manage members</option>
              </select>
              <Button type="submit" disabled={pending}>
                {pending ? "Sending…" : "Send invitation"}
              </Button>
            </form>
          )}
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="text-sm">
              {message}
            </p>
          )}
          {invitations.length > 0 ? (
            invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex justify-between gap-3 border-t pt-3 text-sm"
              >
                <span className="truncate">{invitation.email}</span>
                <span className="text-muted-foreground capitalize">
                  {invitation.role || "member"} · pending
                </span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              No pending invitations.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
