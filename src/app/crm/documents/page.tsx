import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { MainNav } from "@/components/navigation";
import { DocumentsContent } from "./documents-content";

export default async function DocumentsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      <MainNav />
      <DocumentsContent />
    </div>
  );
}
