import { MainNav } from "@/components/navigation";
import { LeadsContent } from "./leads-content";

export default function LeadsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      <MainNav />
      <LeadsContent />
    </div>
  );
}
