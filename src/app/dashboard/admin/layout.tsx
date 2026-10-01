import { requireAdminAccess, AuthError } from "@/lib/dal";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdminAccess();
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(error.message === "Unauthorized" ? "/login" : "/dashboard");
    }
    redirect("/dashboard");
  }

  return <>{children}</>;
}
