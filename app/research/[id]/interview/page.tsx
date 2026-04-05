"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  COMPANY_DIFFICULTY,
  CompanyInterviewHistoryResponse,
  generateInterview,
  getCompanyInterviewHistory,
  InterviewMode,
} from "@/lib/interview";
import { getResearchWork } from "@/lib/research";
import { useLLMSessionStore } from "@/lib/store";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  BarChart3,
  Video,
  Clock3,
  ClipboardCheck,
} from "lucide-react";

const INTERVIEW_MODES: Array<{
  value: InterviewMode;
  label: string;
  description: string;
}> = [
  {
    value: "practice",
    label: "Practice Mode",
    description: "Guided flow with hints and iterative learning.",
  },
  {
    value: "test",
    label: "Timed Test Mode",
    description: "Timer-driven mock interview to simulate pressure.",
  },
  {
    value: "video",
    label: "Video Interview Mode",
    description: "Webcam + spoken answers with transcript-based feedback.",
  },
];

export default function InterviewGenerationPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const { toast } = useToast();
  const researchId = Array.isArray(routeParams.id)
    ? routeParams.id[0]
    : routeParams.id;

  const llmCredentials = useLLMSessionStore((state) => state.credentials);
  const hasLLMCredentials = useLLMSessionStore((state) =>
    state.hasCredentials(),
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingPrerequisite, setIsCheckingPrerequisite] = useState(true);
  const [hasAnalyzedLink, setHasAnalyzedLink] = useState(false);
  const [company, setCompany] = useState("");
  const [customCompany, setCustomCompany] = useState("");
  const [difficulty, setDifficulty] = useState<
    "auto" | "easy" | "medium" | "hard"
  >("auto");
  const [mode, setMode] = useState<InterviewMode>("practice");
  const [testDurationMinutes, setTestDurationMinutes] = useState("30");

  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] =
    useState<CompanyInterviewHistoryResponse | null>(null);

  const companyList = Object.keys(COMPANY_DIFFICULTY);
  const selectedCompany = company === "custom" ? customCompany.trim() : company;

  const defaultCompanyDifficulty = useMemo(
    () => COMPANY_DIFFICULTY[selectedCompany] || "medium",
    [selectedCompany],
  );

  const suggestedDifficulty =
    history?.recommendedDifficulty || defaultCompanyDifficulty;

  useEffect(() => {
    const checkPrerequisites = async () => {
      if (!researchId) {
        setIsCheckingPrerequisite(false);
        return;
      }

      setIsCheckingPrerequisite(true);
      const response = await getResearchWork(researchId);

      if (!response.success || !response.data) {
        toast({
          title: "Error",
          description:
            response.message || "Failed to validate interview prerequisites",
          variant: "destructive",
        });
        if (typeof window !== "undefined") {
          window.location.replace("/dashboard");
        }
        return;
      }

      const analyzedCount = response.data.links.filter(
        (link) => link.analysis?.summary,
      ).length;
      const unlocked = analyzedCount > 0;
      setHasAnalyzedLink(unlocked);

      if (!unlocked) {
        toast({
          title: "Analyze first",
          description:
            "Analyze at least one link before generating interview questions",
          variant: "destructive",
        });
        if (typeof window !== "undefined") {
          window.location.replace(`/research/${researchId}`);
        }
        return;
      }

      setIsCheckingPrerequisite(false);
    };

    checkPrerequisites();
  }, [researchId, toast]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedCompany || !researchId) {
        setHistory(null);
        return;
      }

      setHistoryLoading(true);
      const response = await getCompanyInterviewHistory(
        selectedCompany,
        researchId,
        20,
      );
      if (response.success && response.data) {
        setHistory(response.data);
      } else {
        setHistory(null);
      }
      setHistoryLoading(false);
    };

    loadHistory();
  }, [selectedCompany, researchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCompany) {
      toast({
        title: "Missing information",
        description: "Please select a company",
        variant: "destructive",
      });
      return;
    }

    if (!hasLLMCredentials) {
      toast({
        title: "Missing API key",
        description: "Set your credentials first on the research page",
        variant: "destructive",
      });
      return;
    }

    if (mode === "test") {
      const parsedDuration = Number.parseInt(testDurationMinutes, 10);
      if (
        !Number.isFinite(parsedDuration) ||
        parsedDuration < 5 ||
        parsedDuration > 180
      ) {
        toast({
          title: "Invalid duration",
          description: "Test duration must be between 5 and 180 minutes",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      if (!researchId) {
        toast({
          title: "Missing route id",
          description: "Could not resolve research id from URL",
          variant: "destructive",
        });
        return;
      }

      const response = await generateInterview({
        researchWorkId: researchId,
        company: selectedCompany,
        customDifficulty: difficulty === "auto" ? undefined : difficulty,
        mode,
        testDurationMinutes:
          mode === "test"
            ? Number.parseInt(testDurationMinutes, 10)
            : undefined,
        apiKey: llmCredentials.apiKey,
        provider: llmCredentials.provider,
        model: llmCredentials.model,
        ...(llmCredentials.provider === "custom" && llmCredentials.baseUrl
          ? { baseUrl: llmCredentials.baseUrl }
          : {}),
      });

      if (!response.success) {
        toast({
          title: "Generation failed",
          description: response.message || "Could not generate interview",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Interview generated",
        description: `Mode: ${mode}. Difficulty: ${response.data?.difficulty || suggestedDifficulty}`,
      });

      router.push(`/interview/${response.data?.interviewId}`);
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingPrerequisite) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="p-8 mb-6">
          <h1 className="text-3xl font-bold mb-2">
            Developer Interview Builder
          </h1>
          <p className="text-muted-foreground mb-4">
            Build company-specific interviews from analyzed papers/blogs, with
            history-aware difficulty and full simulation modes.
          </p>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <ClipboardCheck className="w-3.5 h-3.5" />
              Company-specific prompts
            </Badge>
            <Badge variant="outline" className="gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              History-aware difficulty
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Video className="w-3.5 h-3.5" />
              Video mode
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock3 className="w-3.5 h-3.5" />
              Timed test mode
            </Badge>
          </div>
        </Card>

        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            This stage uses your analyzed research context plus company-specific
            interview style.
          </AlertDescription>
        </Alert>

        <Alert className="mb-6 border-green-200 bg-green-50">
          <KeyRound className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Credentials in use: {llmCredentials.provider}/{llmCredentials.model}
          </AlertDescription>
        </Alert>

        {!hasLLMCredentials && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertDescription className="text-amber-800">
              No local device credentials found. Go back to research page and
              save your API key first.
            </AlertDescription>
          </Alert>
        )}

        {!hasAnalyzedLink && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertDescription className="text-amber-800">
              Interview is locked until at least one link is analyzed.
            </AlertDescription>
          </Alert>
        )}

        <Card className="p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium mb-2"
              >
                Company *
              </label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger disabled={isLoading}>
                  <SelectValue placeholder="Select or add company" />
                </SelectTrigger>
                <SelectContent>
                  {companyList.map((comp) => (
                    <SelectItem key={comp} value={comp}>
                      {comp} ({COMPANY_DIFFICULTY[comp]})
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Add Custom Company</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {company === "custom" && (
              <div>
                <label
                  htmlFor="customCompany"
                  className="block text-sm font-medium mb-2"
                >
                  Custom Company Name
                </label>
                <Input
                  id="customCompany"
                  placeholder="Enter company name"
                  value={customCompany}
                  onChange={(e) => setCustomCompany(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="mode" className="block text-sm font-medium mb-2">
                Interview Mode *
              </label>
              <Select
                value={mode}
                onValueChange={(value) => setMode(value as InterviewMode)}
              >
                <SelectTrigger disabled={isLoading}>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {INTERVIEW_MODES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                {
                  INTERVIEW_MODES.find((item) => item.value === mode)
                    ?.description
                }
              </p>
            </div>

            {mode === "test" && (
              <div>
                <label
                  htmlFor="testDuration"
                  className="block text-sm font-medium mb-2"
                >
                  Test Duration (minutes)
                </label>
                <Input
                  id="testDuration"
                  type="number"
                  min={5}
                  max={180}
                  value={testDurationMinutes}
                  onChange={(e) => setTestDurationMinutes(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <label
                htmlFor="difficulty"
                className="block text-sm font-medium mb-2"
              >
                Difficulty Override (Optional)
              </label>
              <Select
                value={difficulty}
                onValueChange={(value) =>
                  setDifficulty(value as "auto" | "easy" | "medium" | "hard")
                }
              >
                <SelectTrigger disabled={isLoading}>
                  <SelectValue
                    placeholder={`Suggested: ${suggestedDifficulty}`}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    Auto ({suggestedDifficulty})
                  </SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !hasLLMCredentials || !hasAnalyzedLink}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Interview Session"
              )}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Company Interview History</h2>
            {historyLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {!selectedCompany ? (
            <p className="text-sm text-muted-foreground">
              Select a company to load historical interview performance and
              questions.
            </p>
          ) : !history ? (
            <p className="text-sm text-muted-foreground">
              No history yet for this company on this research context.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Attempts</p>
                  <p className="text-lg font-semibold">{history.attempts}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Completion</p>
                  <p className="text-lg font-semibold">
                    {Math.round(history.completionRate * 100)}%
                  </p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">Recommended</p>
                  <p className="text-lg font-semibold capitalize">
                    {history.recommendedDifficulty}
                  </p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-muted-foreground">
                    Video Sessions
                  </p>
                  <p className="text-lg font-semibold">
                    {history.modeDistribution.video}
                  </p>
                </Card>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Recent Questions</p>
                {history.recentQuestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No prior generated questions for this company.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-auto pr-1">
                    {history.recentQuestions.slice(0, 10).map((item) => (
                      <Card
                        key={`${item.interviewId}-${item.questionId}`}
                        className="p-3"
                      >
                        <p className="text-sm font-medium">{item.question}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary">{item.topic}</Badge>
                          <Badge variant="outline" className="capitalize">
                            {item.difficulty}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
