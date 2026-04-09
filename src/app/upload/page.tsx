import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { MainNav } from "@/components/navigation";
import { UploadContent } from "./upload-content";

export default async function UploadPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      <MainNav />
      <UploadContent />
    </div>
  );
}
