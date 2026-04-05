"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getTrendingResearch,
  discoverResearch,
  getResearchFields,
  incrementViews,
  shareResearch,
  DiscoverResearchItem,
  TrendingResearch,
} from "@/lib/discover";
import { ResearchCard } from "@/components/ResearchCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Compass,
  TrendingUp,
  Sparkles,
  Search,
  Flame,
  Share2,
  RefreshCw,
} from "lucide-react";

const TRENDING_REFRESH_INTERVAL_MS = 12000;

export function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [view, setView] = useState<"trending" | "discover">(
    (searchParams.get("view") as "trending" | "discover") || "trending",
  );
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [selectedField, setSelectedField] = useState(
    searchParams.get("field") || "",
  );
  const [difficulty, setDifficulty] = useState(
    searchParams.get("difficulty") || "",
  );

  const [trendingData, setTrendingData] = useState<TrendingResearch[]>([]);
  const [discoverData, setDiscoverData] = useState<DiscoverResearchItem[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [personalizationStatus, setPersonalizationStatus] = useState<
    "anonymous" | "insufficient_signals" | "personalized" | "no_candidates"
  >("anonymous");
  const [interestKeywords, setInterestKeywords] = useState<string[]>([]);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [lastTrendingSyncAt, setLastTrendingSyncAt] = useState<Date | null>(
    null,
  );

  useEffect(() => {
    const loadFields = async () => {
      const response = await getResearchFields();
      if (response.success && response.data) {
        setFields(response.data);
      }
    };

    loadFields();
  }, []);

  const fetchTrending = useCallback(
    async ({ showLoader = true, silent = false } = {}) => {
      if (showLoader) {
        setIsLoading(true);
      }

      const response = await getTrendingResearch(page, 20, selectedField);
      if (response.success && response.data) {
        setTrendingData(response.data.items || []);
        setTotalPages(response.data.pagination?.pages || 1);
        setPersonalizationStatus(
          response.data.personalization?.status || "anonymous",
        );
        setInterestKeywords(
          response.data.personalization?.topInterestKeywords || [],
        );
        setLastTrendingSyncAt(new Date());
      } else if (!silent) {
        toast({
          title: "Error",
          description: response.message || "Failed to load trending research",
          variant: "destructive",
        });
      }

      if (showLoader) {
        setIsLoading(false);
      }
    },
    [page, selectedField, toast],
  );

  const fetchDiscover = useCallback(async () => {
    setIsLoading(true);

    const response = await discoverResearch(page, 20, {
      field: selectedField,
      difficulty,
      searchTerm,
    });

    if (response.success && response.data) {
      setDiscoverData(response.data.items || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setPersonalizationStatus(
        response.data.personalization?.status || "anonymous",
      );
      setInterestKeywords(
        response.data.personalization?.topInterestKeywords || [],
      );
    } else {
      toast({
        title: "Error",
        description: response.message || "Failed to load research",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  }, [page, selectedField, difficulty, searchTerm, toast]);

  useEffect(() => {
    if (view === "trending") {
      fetchTrending();
      return;
    }

    fetchDiscover();
  }, [view, fetchTrending, fetchDiscover]);

  useEffect(() => {
    if (view !== "trending" || !autoRefreshEnabled) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        return;
      }

      setIsAutoRefreshing(true);
      await fetchTrending({ showLoader: false, silent: true });
      setIsAutoRefreshing(false);
    }, TRENDING_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [view, autoRefreshEnabled, fetchTrending]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleFieldChange = (field: string) => {
    setSelectedField(field === "all-fields" ? "" : field);
    setPage(1);
  };

  const handleDifficultyChange = (diff: string) => {
    setDifficulty(diff === "all-levels" ? "" : diff);
    setPage(1);
  };

  const trackAndOpen = async (researchId: string) => {
    const tracked = await incrementViews(researchId);
    if (!tracked.success) {
      toast({
        title: "Tracking issue",
        description: tracked.message || "Unable to register view signal",
        variant: "destructive",
      });
    }

    router.push(`/research/${researchId}`);
  };

  const trackShare = async (researchId: string) => {
    const response = await shareResearch(researchId);
    if (!response.success) {
      toast({
        title: "Share failed",
        description: response.message || "Unable to register share signal",
        variant: "destructive",
      });
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(
        `${window.location.origin}/research/${researchId}`,
      );
    }

    toast({
      title: "Shared",
      description: "Link copied and preference signal recorded",
    });
  };

  const personalizationHint =
    personalizationStatus === "personalized"
      ? "Ranked using your real behavior signals."
      : personalizationStatus === "insufficient_signals"
        ? "Need more actions (search, view, analyze, share) for stronger personalization."
        : personalizationStatus === "anonymous"
          ? "Login to activate personalized ranking."
          : "No candidates available for the current filters.";

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <Card className="overflow-hidden border-none bg-[linear-gradient(120deg,#0f172a,#1e3a8a,#0e7490)] text-white shadow-2xl shadow-sky-200/60">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="p-8 lg:col-span-7 lg:p-10">
              <h1 className="text-4xl font-extrabold mb-2">
                Discover Research
              </h1>
              <p className="text-sky-100/95">
                Your feed continuously adapts from searches, analyses, views,
                and shares.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                <Sparkles className="h-3.5 w-3.5" />
                Personalized Signal Engine
              </div>
            </div>
            <div
              className="min-h-[180px] lg:col-span-5"
              style={{
                backgroundImage:
                  "linear-gradient(to top, rgba(6, 11, 26, 0.45), rgba(6, 11, 26, 0.08)), url('/media/network-abstract.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </div>
        </Card>

        <Card className="mt-5 border-dashed">
          <div className="p-4 flex flex-wrap items-center gap-3">
            <Badge
              variant={
                personalizationStatus === "personalized"
                  ? "default"
                  : "secondary"
              }
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {personalizationStatus === "personalized"
                ? "Personalized ranking active"
                : "Learning mode"}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {personalizationHint}
            </p>
            {interestKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {interestKeywords.slice(0, 6).map((keyword) => (
                  <Badge key={keyword} variant="outline">
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="flex gap-4 mb-8">
        <Button
          variant={view === "trending" ? "default" : "outline"}
          className={
            view === "trending" ? "bg-slate-900 text-white" : "bg-white/85"
          }
          onClick={() => {
            setView("trending");
            setPage(1);
          }}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Trending
        </Button>
        <Button
          variant={view === "discover" ? "default" : "outline"}
          className={
            view === "discover" ? "bg-slate-900 text-white" : "bg-white/85"
          }
          onClick={() => {
            setView("discover");
            setPage(1);
          }}
        >
          <Compass className="w-4 h-4 mr-2" />
          Browse
        </Button>
      </div>

      {view === "trending" && (
        <Card className="p-4 mb-8 border-slate-200/70 bg-white/85 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={autoRefreshEnabled ? "default" : "outline"}>
              {autoRefreshEnabled ? "Live refresh on" : "Live refresh paused"}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Auto-search runs every{" "}
              {Math.round(TRENDING_REFRESH_INTERVAL_MS / 1000)} seconds while
              this tab is open.
            </p>
            {lastTrendingSyncAt && (
              <p className="text-xs text-muted-foreground">
                Last sync: {lastTrendingSyncAt.toLocaleTimeString()}
              </p>
            )}

            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefreshEnabled((current) => !current)}
              >
                {autoRefreshEnabled ? "Pause live" : "Resume live"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTrending({ showLoader: false })}
                disabled={isAutoRefreshing}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isAutoRefreshing ? "animate-spin" : ""}`}
                />
                Refresh now
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 mb-8 border-slate-200/70 bg-white/85 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Field</label>
            <Select
              value={selectedField || "all-fields"}
              onValueChange={handleFieldChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All fields" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-fields">All fields</SelectItem>
                {fields.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {view === "discover" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Difficulty
                </label>
                <Select
                  value={difficulty || "all-levels"}
                  onValueChange={handleDifficultyChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-levels">All levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <form
                onSubmit={handleSearch}
                className="md:col-span-2 flex gap-2"
              >
                <Input
                  type="search"
                  placeholder="Search by title, tags, topic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit" variant="outline">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </form>
            </>
          )}
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : view === "trending" ? (
        <div className="space-y-6 mb-8">
          {trendingData.length === 0 ? (
            <Card className="p-12 text-center border-slate-200/70 bg-white/85 backdrop-blur-sm">
              <p className="text-muted-foreground">No trending research yet</p>
            </Card>
          ) : (
            trendingData.map((item) => {
              const research = item.researchWorkId;
              return (
                <Card
                  key={item._id}
                  className="overflow-hidden border-slate-200/75 bg-white/90 p-0 shadow-sm backdrop-blur-sm"
                >
                  <div
                    className="h-20 w-full bg-cover bg-center"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, rgba(15, 23, 42, 0.65), rgba(14, 116, 144, 0.35)), url('/media/discover-hero.jpg')",
                    }}
                  />
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <h3 className="text-xl font-semibold mb-2">
                          {research.title}
                        </h3>
                        <p className="text-muted-foreground mb-4 line-clamp-2">
                          {research.description}
                        </p>

                        {item.recommendation && (
                          <div className="mb-3 text-xs text-muted-foreground space-y-1">
                            {item.recommendation.matchedField && (
                              <p>
                                Matched field:{" "}
                                <span className="font-medium">
                                  {item.recommendation.matchedField}
                                </span>
                              </p>
                            )}
                            {(item.recommendation.matchedTags?.length || 0) >
                              0 && (
                              <p>
                                Matched tags:{" "}
                                {item.recommendation.matchedTags?.join(", ")}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => trackAndOpen(research._id)}
                          >
                            <Flame className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => trackShare(research._id)}
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 p-4 bg-muted rounded">
                        <div>
                          <p className="text-xs text-muted-foreground">Score</p>
                          <p className="text-2xl font-bold">
                            {item.score.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Views</p>
                          <p className="text-lg font-semibold">{item.views}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Analyzed
                          </p>
                          <p className="text-lg font-semibold">
                            {item.analyzedCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {discoverData.length === 0 ? (
            <Card className="p-12 text-center col-span-full border-slate-200/70 bg-white/85 backdrop-blur-sm">
              <p className="text-muted-foreground">No research found</p>
            </Card>
          ) : (
            discoverData.map((research) => (
              <ResearchCard
                key={research._id}
                research={research}
                recommendation={research.recommendation}
                onView={trackAndOpen}
                onShare={trackShare}
              />
            ))
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            className="bg-white/90"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            className="bg-white/90"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
