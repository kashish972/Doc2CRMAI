import { MainNav } from "@/components/navigation";
import { UploadContent } from "./upload-content";

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      <MainNav />
      <UploadContent />
    </div>
  );
}
