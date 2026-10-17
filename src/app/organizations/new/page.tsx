import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/lib/dal";
import {
  getOrganizationForUser,
  getPendingInvitationsForEmail,
} from "@/lib/organization";
import { Button } from "@/components/ui/button";
import { CreateOrganizationForm } from "./create-organization-form";

export default async function NewOrganizationPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?callbackUrl=/dashboard");

  const organization = await getOrganizationForUser(session.user.id);
  if (organization) redirect("/dashboard");
  const pendingInvitations = await getPendingInvitationsForEmail(
    session.user.email
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold">Choose your organization</h1>
      <p className="text-muted-foreground mt-3">
        Join a team that invited you, or create a new shared space.
      </p>
      {pendingInvitations.length > 0 && (
        <section className="mt-8 space-y-3" aria-label="Pending invitations">
          <h2 className="text-lg font-semibold">Your invitations</h2>
          {pendingInvitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between gap-4 rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">{invitation.organizationName}</p>
                <p className="text-muted-foreground text-sm">
                  Invited as {invitation.role || "member"}
                </p>
              </div>
              <Button asChild>
                <Link href={`/invitations/${invitation.id}`}>Join</Link>
              </Button>
            </div>
          ))}
        </section>
      )}
      <section className="mt-8 border-t pt-8">
        <h2 className="text-lg font-semibold">Create a new organization</h2>
        <CreateOrganizationForm
          hasPendingInvitations={pendingInvitations.length > 0}
        />
      </section>
    </main>
  );
}
