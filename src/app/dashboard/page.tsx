import { MainNav } from "@/components/navigation";
import { DashboardContent } from "./dashboard-content";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      <MainNav />
      <DashboardContent />
    </div>
  );
}
