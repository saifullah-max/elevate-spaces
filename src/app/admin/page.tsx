import { redirect } from "next/navigation";

export default function AdminRootPage() {
  // Always redirect /admin to /admin/dashboard
  redirect("/admin/dashboard");
  return null;
}
