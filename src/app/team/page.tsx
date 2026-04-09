import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { connectToPlatformDatabase } from "@/server/db";
import { PlatformTenantModel } from "@/server/models/platform";
import { MainNav } from "@/components/navigation";
import { TeamContent } from "./team-content";

export default async function TeamPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "owner" && session.role !== "admin") {
    redirect("/dashboard");
  }

  await connectToPlatformDatabase();
  const tenant = await PlatformTenantModel.findById(session.tenantId).exec();

  if (!tenant) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      <MainNav />
      <TeamContent tenantName={tenant.name} tenantSlug={tenant.slug} />
    </div>
  );
}