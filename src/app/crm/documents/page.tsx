import { MainNav } from "@/components/navigation";
import { DocumentsContent } from "./documents-content";

export default function DocumentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      <MainNav />
      <DocumentsContent />
    </div>
  );
}
