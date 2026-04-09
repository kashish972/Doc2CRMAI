import { MainNav } from "@/components/navigation";
import { ReviewContent } from "./review-content";

export default function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ createForm?: string }>;
}) {
  const shouldPrepareGoogleFormPromise = searchParams.then(
    (sp) => sp.createForm === "1"
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      <MainNav />
      <ReviewContent
        idPromise={params}
        shouldPrepareGoogleFormPromise={shouldPrepareGoogleFormPromise}
      />
    </div>
  );
}
