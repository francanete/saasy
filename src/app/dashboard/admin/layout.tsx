import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Check if user is admin
  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) ?? [];

  if (!adminEmails.includes(session.user.email)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
