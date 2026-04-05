"use client";

import { useRouter } from "next/navigation";
import { ResearchWork } from "@/lib/research";
import { RecommendationMeta } from "@/lib/discover";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, Sparkles, Share2 } from "lucide-react";

interface ResearchCardProps {
  research: ResearchWork;
  onDelete?: (id: string) => void;
  onView?: (id: string) => Promise<void> | void;
  onShare?: (id: string) => Promise<void> | void;
  recommendation?: RecommendationMeta;
}

export function ResearchCard({
  research,
  onDelete,
  onView,
  onShare,
  recommendation,
}: ResearchCardProps) {
  const router = useRouter();

  const handleOpen = async () => {
    await onView?.(research._id);
    router.push(`/research/${research._id}`);
  };

  return (
    <Card className="group overflow-hidden border-slate-200/80 bg-white/85 p-0 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-200/50">
      <div
        className="h-28 w-full bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15, 23, 42, 0.65), rgba(14, 116, 144, 0.4)), url('/media/code-screens.jpg')",
        }}
      >
        <div className="flex h-full items-end px-6 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/90">
            Research Workspace
          </p>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{research.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {research.description || "No description"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline">{research.field}</Badge>
          <Badge
            variant={
              research.difficulty === "advanced"
                ? "destructive"
                : research.difficulty === "intermediate"
                  ? "secondary"
                  : "outline"
            }
          >
            {research.difficulty}
          </Badge>
          {recommendation && recommendation.affinityScore > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="w-3 h-3" />
              For you
            </Badge>
          )}
        </div>

        {recommendation && (
          <div className="mb-4 p-3 bg-muted rounded text-xs text-muted-foreground space-y-1">
            {recommendation.matchedField && (
              <p>Matched field: {recommendation.matchedField}</p>
            )}
            {(recommendation.matchedTags?.length || 0) > 0 && (
              <p>
                Tags you engage with: {recommendation.matchedTags?.join(", ")}
              </p>
            )}
            {(recommendation.matchedKeywords?.length || 0) > 0 && (
              <p>
                Similar topics:{" "}
                {recommendation.matchedKeywords?.slice(0, 3).join(", ")}
              </p>
            )}
          </div>
        )}

        {research.links.length > 0 && (
          <div className="mb-4 p-3 bg-muted rounded">
            <p className="text-xs text-muted-foreground mb-2">
              {research.links.length} link
              {research.links.length !== 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-1">
              {research.links.slice(0, 3).map((link, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {link.type}
                </Badge>
              ))}
              {research.links.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{research.links.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            size="sm"
            onClick={handleOpen}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View
          </Button>
          {onShare && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShare(research._id)}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(research._id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
