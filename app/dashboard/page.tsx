"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { apiClient } from "@/lib/api";
import {
  getResearchWorks,
  deleteResearchWork,
  ResearchWork,
} from "@/lib/research";
import { Navbar } from "@/components/Navbar";
import { ExtensionInstallPrompt } from "@/components/ExtensionInstallPrompt";
import { ResearchCard } from "@/components/ResearchCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, BarChart3, WandSparkles } from "lucide-react";

export default function DashboardPage() {
  const { user, token, hasHydrated, setToken } = useAuthStore();
  const { toast } = useToast();
  const hasRedirectedRef = useRef(false);
  const [researches, setResearches] = useState<ResearchWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const stats = useMemo(() => {
    const totalLinks = researches.reduce(
      (acc, item) => acc + item.links.length,
      0,
    );
    const analyzedLinks = researches.reduce(
      (acc, item) =>
        acc +
        item.links.filter((link) => Boolean(link.analysis?.summary)).length,
      0,
    );
    const activeFields = new Set(researches.map((item) => item.field)).size;

    return {
      totalLinks,
      analyzedLinks,
      activeFields,
    };
  }, [researches]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    let effectiveToken = token;
    if (!effectiveToken) {
      const restoredToken = apiClient.getToken();
      if (restoredToken) {
        setToken(restoredToken);
        effectiveToken = restoredToken;
      }
    }

    if (!effectiveToken) {
      if (!hasRedirectedRef.current && typeof window !== "undefined") {
        hasRedirectedRef.current = true;
        window.location.replace("/login");
      }
      return;
    }

    const loadResearches = async () => {
      setIsLoading(true);
      const response = await getResearchWorks(page, 10);

      if (response.success && response.data) {
        setResearches(response.data.data);
        setTotalPages(response.data.pagination.pages);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load research works",
          variant: "destructive",
        });
      }

      setIsLoading(false);
    };

    loadResearches();
  }, [token, hasHydrated, setToken, page, toast]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this research work?")) return;

    const response = await deleteResearchWork(id);

    if (response.success) {
      setResearches((prev) => prev.filter((r) => r._id !== id));
      toast({
        title: "Success",
        description: "Research work deleted",
      });
    } else {
      toast({
        title: "Error",
        description: response.message || "Failed to delete",
        variant: "destructive",
      });
    }
  };

  if (!hasHydrated || !token) return null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,#f5f7ff_35%,#eef2ff_70%,#e2e8f0_100%)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage: "url('/media/dashboard-hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <Navbar />
      <ExtensionInstallPrompt />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="mb-8 overflow-hidden border-none bg-[linear-gradient(120deg,#0f172a,#1e3a8a,#0369a1)] text-white shadow-2xl shadow-blue-300/40">
          <div className="grid grid-cols-1 items-stretch lg:grid-cols-12">
            <div className="p-8 lg:col-span-7 lg:p-10">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                <WandSparkles className="h-3.5 w-3.5" />
                Developer Research Workspace
              </div>
              <h1 className="text-4xl font-extrabold leading-tight mb-3">
                Your Research Works
              </h1>
              <p className="text-sky-100/95 max-w-2xl">
                Organize links, analyze technical content deeply, and convert
                every finding into interview-ready insight.
              </p>
              <div className="mt-6">
                <Link href="/research/new">
                  <Button className="bg-white text-slate-900 hover:bg-slate-100">
                    <Plus className="w-4 h-4 mr-2" />
                    New Research
                  </Button>
                </Link>
              </div>
            </div>

            <div
              className="min-h-[220px] lg:col-span-5"
              style={{
                backgroundImage:
                  "linear-gradient(to top, rgba(6, 11, 26, 0.5), rgba(6, 11, 26, 0.12)), url('/media/developer-workstation.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3">
          <Card className="border-slate-200/70 bg-white/80 p-5 backdrop-blur-sm">
            <p className="text-sm text-slate-500">Research works</p>
            <p className="text-3xl font-extrabold text-slate-900">
              {researches.length}
            </p>
          </Card>
          <Card className="border-slate-200/70 bg-white/80 p-5 backdrop-blur-sm">
            <p className="text-sm text-slate-500">Links analyzed</p>
            <p className="text-3xl font-extrabold text-slate-900">
              {stats.analyzedLinks}/{stats.totalLinks}
            </p>
          </Card>
          <Card className="border-slate-200/70 bg-white/80 p-5 backdrop-blur-sm">
            <p className="text-sm text-slate-500">Active fields</p>
            <p className="text-3xl font-extrabold text-slate-900">
              {stats.activeFields}
            </p>
          </Card>
        </div>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-slate-900">
            Workspace Boards
          </h2>
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
            <BarChart3 className="w-4 h-4" />
            Personalized research productivity overview
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : researches.length === 0 ? (
          <Card className="p-12 text-center border-slate-200/70 bg-white/85 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-2">
              No research works yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first research work or analyzing a
              link.
            </p>
            <Link href="/research/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Research
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {researches.map((research) => (
                <ResearchCard
                  key={research._id}
                  research={research}
                  onDelete={handleDelete}
                />
              ))}
            </div>

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
          </>
        )}
      </div>
    </div>
  );
}
