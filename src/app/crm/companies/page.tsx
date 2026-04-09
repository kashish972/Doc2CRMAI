import { MainNav } from "@/components/navigation";
import { CompaniesContent } from "./companies-content";

export default function CompaniesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      <MainNav />
      <p>Companies</p>
      <CompaniesContent />
    </div>
  );
}
