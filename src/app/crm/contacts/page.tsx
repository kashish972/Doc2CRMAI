import { MainNav } from "@/components/navigation";
import { ContactsContent } from "./contacts-content";

export default function ContactsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      <MainNav />
      <ContactsContent />
    </div>
  );
}
