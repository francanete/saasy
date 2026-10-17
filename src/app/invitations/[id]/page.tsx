import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/dal";
import {
  getOrganizationForUser,
  getPendingInvitationForEmail,
} from "@/lib/organization";
import { getRecoveryBlockReason } from "@/lib/organization-recovery";
import { AcceptInvitation } from "./accept-invitation";
import { RecoverInvitation } from "./recover-invitation";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCurrentSession();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/invitations/${id}`)}`);
  }

  const invitation = await getPendingInvitationForEmail(id, session.user.email);
  if (!invitation) {
    return (
      <main className="mx-auto max-w-xl px-6 py-20">
        <h1 className="text-3xl font-semibold">Invitation unavailable</h1>
        <p className="text-muted-foreground mt-3">
          This invitation may have expired or be addressed to a different
          account.
        </p>
      </main>
    );
  }

  const organization = await getOrganizationForUser(session.user.id);
  const recoveryBlock =
    organization && organization.id !== invitation.organizationId
      ? await getRecoveryBlockReason(organization, session.user.id)
      : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold">
        Join {invitation.organizationName}
      </h1>
      {organization?.id === invitation.organizationId ? (
        <p className="text-muted-foreground mt-4">
          You already belong to this organization.
        </p>
      ) : organization && recoveryBlock ? (
        <div className="mt-4 space-y-2">
          <p>Your account belongs to {organization.name}.</p>
          <p className="text-muted-foreground">{recoveryBlock}</p>
        </div>
      ) : organization ? (
        <RecoverInvitation
          invitationId={id}
          currentOrganizationName={organization.name}
          invitedOrganizationName={invitation.organizationName}
        />
      ) : (
        <AcceptInvitation invitationId={id} />
      )}
    </main>
  );
}
