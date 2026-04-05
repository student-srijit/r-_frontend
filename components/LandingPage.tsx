"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Chrome,
  Clock3,
  FileSearch,
  Lightbulb,
  Mic,
  ShieldCheck,
  Sparkles,
  Target,
  Video,
  WandSparkles,
} from "lucide-react";

const rolePresets = {
  student: {
    label: "Student",
    pain: "I read a lot, but freeze when interviewers ask deep follow-up questions.",
    output:
      "Build concept confidence from real papers and generate targeted questions by company.",
  },
  engineer: {
    label: "Engineer",
    pain: "I skim blogs/papers but struggle to convert them into implementation decisions.",
    output:
      "Extract practical tradeoffs, architecture insights, and role-specific mock interviews fast.",
  },
  founder: {
    label: "Founder",
    pain: "I need to evaluate technical trends quickly without reading everything end-to-end.",
    output:
      "Get structured intelligence from links, then pressure-test your understanding with interview mode.",
  },
} as const;

type RoleKey = keyof typeof rolePresets;

export function LandingPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleKey>("engineer");
  const [linksPerWeek, setLinksPerWeek] = useState(20);
  const [teamSize, setTeamSize] = useState(3);

  const selected = rolePresets[selectedRole];

  const impact = useMemo(() => {
    const avgMinutesWithoutTool = 52;
    const avgMinutesWithTool = 16;
    const weeklySavedMinutesPerPerson =
      linksPerWeek * (avgMinutesWithoutTool - avgMinutesWithTool);
    const weeklySavedTeamHours = (weeklySavedMinutesPerPerson * teamSize) / 60;

    return {
      weeklySavedTeamHours: weeklySavedTeamHours.toFixed(1),
      yearlySavedTeamHours: Math.round(weeklySavedTeamHours * 52),
    };
  }, [linksPerWeek, teamSize]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a1024] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,0.24),transparent_40%),radial-gradient(circle_at_85%_20%,rgba(251,146,60,0.24),transparent_35%),radial-gradient(circle_at_50%_85%,rgba(147,51,234,0.16),transparent_45%)]" />

      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0a1024]/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-[#04102a]">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              Research Plus
            </span>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="text-slate-100 hover:bg-white/10"
              onClick={() => router.push("/login")}
            >
              Sign In
            </Button>
            <Button
              className="bg-gradient-to-r from-cyan-400 to-blue-500 text-[#07122e] hover:from-cyan-300 hover:to-blue-400"
              onClick={() => router.push("/register")}
            >
              Start Free
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-20">
        <div className="lg:col-span-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100">
            <Sparkles className="h-3.5 w-3.5" />
            Built For Developers, Not Generic Demo Prompts
          </div>

          <h1 className="text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl">
            Read Less Noise.
            <span className="block bg-gradient-to-r from-cyan-300 via-sky-300 to-orange-300 bg-clip-text text-transparent">
              Prepare Better Interviews.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200/90">
            Anyone can ask a chatbot for a fake demo. Research Plus is
            different: it learns from your actual paper/blog workflow, builds
            company-specific interview sessions, tracks difficulty history, and
            even supports timed and video interview modes.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-[#07122e] hover:from-cyan-300 hover:to-blue-400"
              onClick={() => router.push("/register")}
            >
              Build My Interview Pipeline <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/25 bg-white/5 text-white hover:bg-white/10"
              onClick={() => router.push("/discover")}
            >
              Explore Trending Feed
            </Button>
          </div>

          <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="border-cyan-300/20 bg-white/5 p-4 text-white backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-cyan-100/80">
                Pipeline
              </p>
              <p className="mt-1 text-xl font-bold">
                Link to Insight to Interview
              </p>
            </Card>
            <Card className="border-cyan-300/20 bg-white/5 p-4 text-white backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-cyan-100/80">
                Modes
              </p>
              <p className="mt-1 text-xl font-bold">Practice + Test + Video</p>
            </Card>
            <Card className="border-cyan-300/20 bg-white/5 p-4 text-white backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-cyan-100/80">
                Security
              </p>
              <p className="mt-1 text-xl font-bold">Local Key, No DB Storage</p>
            </Card>
          </div>
        </div>

        <div className="relative lg:col-span-6">
          <div className="grid grid-cols-2 gap-4">
            <img
              src="/media/developer-workstation.jpg"
              alt="Developer workstation"
              className="hero-float col-span-2 h-64 w-full rounded-2xl object-cover shadow-2xl shadow-black/40"
            />
            <img
              src="/media/code-screens.jpg"
              alt="Code screens"
              className="reveal-up h-44 w-full rounded-2xl object-cover shadow-xl shadow-black/30"
            />
            <img
              src="/media/network-abstract.jpg"
              alt="Network abstract"
              className="reveal-up h-44 w-full rounded-2xl object-cover shadow-xl shadow-black/30"
              style={{ animationDelay: "120ms" }}
            />
          </div>

          <Card className="absolute -bottom-6 right-2 w-[260px] border-white/20 bg-[#0f1a3b]/85 p-4 text-white backdrop-blur-md sm:right-6">
            <div className="mb-2 flex items-center gap-2 text-cyan-200">
              <BarChart3 className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wide">
                Live Intelligence
              </p>
            </div>
            <p className="text-sm text-slate-200">
              Personalized feed ranking and company interview history make each
              session sharper than the last one.
            </p>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Card className="border-red-300/25 bg-red-500/10 p-6 text-red-50">
            <h3 className="mb-2 text-xl font-bold">
              Generic Chat Demo Limitation
            </h3>
            <p className="text-sm leading-relaxed text-red-100/90">
              It does not remember your company-wise interview history, does not
              keep timed test state, and does not adapt question difficulty from
              your actual performance trajectory.
            </p>
          </Card>
          <Card className="border-emerald-300/25 bg-emerald-500/10 p-6 text-emerald-50">
            <h3 className="mb-2 text-xl font-bold">Research Plus Advantage</h3>
            <p className="text-sm leading-relaxed text-emerald-100/90">
              You get a full workflow engine: ingest links, generate detailed
              technical analysis, run company-specific interviews, track
              difficulty trends, and improve through measurable repetition.
            </p>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:px-8">
        <Card className="border-white/15 bg-white/6 p-6 text-white backdrop-blur-md lg:col-span-7">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight">
            Choose Your Developer Track
          </h2>
          <div className="mb-6 flex flex-wrap gap-2">
            {(Object.keys(rolePresets) as RoleKey[]).map((role) => (
              <Button
                key={role}
                size="sm"
                variant={selectedRole === role ? "default" : "outline"}
                className={
                  selectedRole === role
                    ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-[#07122e] hover:from-cyan-300 hover:to-blue-400"
                    : "border-white/30 bg-white/5 text-white hover:bg-white/10"
                }
                onClick={() => setSelectedRole(role)}
              >
                {rolePresets[role].label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border-white/10 bg-[#0f1a3a] p-5 text-slate-100">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-200">
                Current Pain
              </p>
              <p className="text-lg leading-relaxed">{selected.pain}</p>
            </Card>
            <Card className="border-white/10 bg-[#10294a] p-5 text-slate-100">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                With Research Plus
              </p>
              <p className="text-lg leading-relaxed">{selected.output}</p>
            </Card>
          </div>
        </Card>

        <Card className="border-white/15 bg-white/6 p-6 text-white backdrop-blur-md lg:col-span-5">
          <h3 className="mb-4 text-xl font-bold">Impact Simulator</h3>
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm text-cyan-100">
                Links reviewed each week
              </label>
              <input
                type="range"
                min={5}
                max={60}
                value={linksPerWeek}
                onChange={(e) => setLinksPerWeek(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-sm text-slate-200">
                {linksPerWeek} links/week
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm text-cyan-100">
                Team size
              </label>
              <input
                type="range"
                min={1}
                max={15}
                value={teamSize}
                onChange={(e) => setTeamSize(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-sm text-slate-200">{teamSize} developers</p>
            </div>

            <div className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 p-4">
              <p className="text-sm text-cyan-100">Estimated team savings</p>
              <p className="mt-1 text-3xl font-extrabold text-cyan-50">
                {impact.weeklySavedTeamHours} hrs/week
              </p>
              <p className="text-sm text-cyan-100/90">
                ~{impact.yearlySavedTeamHours} hours/year
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: FileSearch,
              title: "Deep Link Analysis",
              text: "Papers, blogs, videos transformed into structured technical insight.",
            },
            {
              icon: Target,
              title: "Company-Specific Interviews",
              text: "Google/Microsoft/custom companies with tuned difficulty logic.",
            },
            {
              icon: Clock3,
              title: "Timed Test Engine",
              text: "Run pressure-mode interview sessions with countdown and completion state.",
            },
            {
              icon: Video,
              title: "Video Interview Mode",
              text: "Webcam + transcript + feedback loop for realistic practice.",
            },
            {
              icon: Lightbulb,
              title: "Learning Feedback",
              text: "AI feedback for every answer to improve technically and structurally.",
            },
            {
              icon: Mic,
              title: "Voice Revision",
              text: "Generate spoken review scripts from dense research context.",
            },
            {
              icon: Chrome,
              title: "Browser Extension",
              text: "Capture and analyze content directly from where you browse.",
            },
            {
              icon: ShieldCheck,
              title: "Local Credential Storage",
              text: "API key stays on your device. Never saved in database.",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card
                key={idx}
                className="border-white/15 bg-white/6 p-5 text-white backdrop-blur-md"
              >
                <Icon className="mb-3 h-6 w-6 text-cyan-300" />
                <h3 className="font-bold">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-200/90">{item.text}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#060b1a] py-14">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-4xl font-extrabold leading-tight">
              Stop Building
              <span className="block bg-gradient-to-r from-cyan-300 to-orange-300 bg-clip-text text-transparent">
                Boring Interview Prep
              </span>
            </h2>
            <p className="mt-4 max-w-xl text-slate-300">
              Bring your own API key, import real research, and train with
              company-level difficulty progression that compounds over time.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-[#07122e] hover:from-cyan-300 hover:to-blue-400"
                onClick={() => router.push("/register")}
              >
                Start Building <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/25 bg-white/5 text-white hover:bg-white/10"
                onClick={() => router.push("/extension")}
              >
                <WandSparkles className="mr-2 h-4 w-4" />
                Setup Extension
              </Button>
            </div>
          </div>

          <img
            src="/media/code-screens.jpg"
            alt="Code and terminal setup"
            className="h-64 w-full rounded-2xl object-cover shadow-2xl shadow-black/40 lg:h-full"
          />
        </div>
      </section>
    </div>
  );
}
