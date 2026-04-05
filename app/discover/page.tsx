import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { DiscoverContent } from "@/components/DiscoverContent";
import { Loader2 } from "lucide-react";

function DiscoverLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,#eff6ff_42%,#f8fafc_100%)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage: "url('/media/discover-hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <Navbar />
      <Suspense fallback={<DiscoverLoading />}>
        <DiscoverContent />
      </Suspense>
    </div>
  );
}
