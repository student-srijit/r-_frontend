"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getResearchWork, type ResearchWork, addLink } from "@/lib/research";
import {
  generateVoiceSummary,
  getVoiceSummary,
  synthesizeVoiceSummary,
} from "@/lib/voice";
import { useLLMSessionStore } from "@/lib/store";
import { Navbar } from "@/components/Navbar";
import { AnalysisForm } from "@/components/AnalysisForm";
import { AnalysisResult } from "@/components/AnalysisResult";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  Zap,
  Volume2,
  KeyRound,
  Play,
  Square,
} from "lucide-react";

const LLM_PROVIDERS = [
  { value: "openai", label: "OpenAI", placeholder: "gpt-4o-mini" },
  {
    value: "anthropic",
    label: "Anthropic",
    placeholder: "claude-3-haiku-20240307",
  },
  { value: "gemini", label: "Google Gemini", placeholder: "gemini-1.5-flash" },
  { value: "groq", label: "Groq", placeholder: "llama-3.3-70b-versatile" },
  {
    value: "together",
    label: "Together.ai",
    placeholder: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  },
  {
    value: "deepinfra",
    label: "DeepInfra",
    placeholder: "meta-llama/Meta-Llama-3.1-70B-Instruct",
  },
  {
    value: "openrouter",
    label: "OpenRouter",
    placeholder: "openai/gpt-4o-mini",
  },
  { value: "mistral", label: "Mistral", placeholder: "mistral-small-latest" },
  {
    value: "perplexity",
    label: "Perplexity",
    placeholder: "llama-3.1-sonar-small-128k-online",
  },
  {
    value: "custom",
    label: "Custom (OpenAI-compat)",
    placeholder: "your-model-name",
  },
];

export default function ResearchDetailPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const { toast } = useToast();
  const researchId = Array.isArray(routeParams.id)
    ? routeParams.id[0]
    : routeParams.id;

  const llmCredentials = useLLMSessionStore((state) => state.credentials);
  const setLLMCredentials = useLLMSessionStore((state) => state.setCredentials);
  const clearLLMCredentials = useLLMSessionStore(
    (state) => state.clearCredentials,
  );
  const hasLLMCredentials = useLLMSessionStore((state) =>
    state.hasCredentials(),
  );

  const [research, setResearch] = useState<ResearchWork | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkType, setNewLinkType] = useState("blog");

  const [sessionProvider, setSessionProvider] = useState(
    llmCredentials.provider,
  );
  const [sessionModel, setSessionModel] = useState(llmCredentials.model);
  const [sessionApiKey, setSessionApiKey] = useState(llmCredentials.apiKey);
  const [sessionBaseUrl, setSessionBaseUrl] = useState(llmCredentials.baseUrl);

  const [voiceScript, setVoiceScript] = useState<string | null>(null);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isSynthesizingVoice, setIsSynthesizingVoice] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEngine, setVoiceEngine] = useState<
    "elevenlabs" | "browser" | null
  >(null);
  const [voiceAudioSrc, setVoiceAudioSrc] = useState<string | null>(null);
  const [voiceStatusMessage, setVoiceStatusMessage] = useState<string | null>(
    null,
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadResearch = async () => {
      if (!researchId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const response = await getResearchWork(researchId);

      if (!response.success || !response.data) {
        toast({
          title: "Error",
          description: response.message || "Failed to load research work",
          variant: "destructive",
        });
        if (typeof window !== "undefined") {
          window.location.replace("/dashboard");
        }
        return;
      }

      setResearch(response.data);

      const voiceResponse = await getVoiceSummary(researchId);
      if (voiceResponse.success && voiceResponse.data?.script) {
        setVoiceScript(voiceResponse.data.script);
      }

      setIsLoading(false);
    };

    loadResearch();
  }, [researchId, router, toast]);

  useEffect(() => {
    setSessionProvider(llmCredentials.provider);
    setSessionModel(llmCredentials.model);
    setSessionApiKey(llmCredentials.apiKey);
    setSessionBaseUrl(llmCredentials.baseUrl);
  }, [
    llmCredentials.provider,
    llmCredentials.model,
    llmCredentials.apiKey,
    llmCredentials.baseUrl,
  ]);

  const handleLLMProviderChange = (value: string) => {
    setSessionProvider(value);
    const selected = LLM_PROVIDERS.find((p) => p.value === value);
    if (selected) {
      setSessionModel(selected.placeholder);
    }
    if (value !== "custom") {
      setSessionBaseUrl("");
    }
  };

  const handleSaveCredentials = () => {
    if (
      !sessionProvider.trim() ||
      !sessionModel.trim() ||
      !sessionApiKey.trim()
    ) {
      toast({
        title: "Missing credentials",
        description: "Provider, model, and API key are required",
        variant: "destructive",
      });
      return;
    }

    if (sessionProvider === "custom" && !sessionBaseUrl.trim()) {
      toast({
        title: "Missing base URL",
        description: "A base URL is required for custom provider",
        variant: "destructive",
      });
      return;
    }

    setLLMCredentials({
      provider: sessionProvider,
      model: sessionModel,
      apiKey: sessionApiKey,
      baseUrl: sessionProvider === "custom" ? sessionBaseUrl : "",
    });

    toast({
      title: "LLM credentials saved",
      description:
        "Stored locally on this device. Never saved in our database.",
    });
  };

  const handleClearCredentials = () => {
    clearLLMCredentials();
    toast({
      title: "Credentials cleared",
      description:
        "Set your credentials again to continue analysis/interview flow",
    });
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!researchId) {
      toast({
        title: "Error",
        description: "Missing research id in route",
        variant: "destructive",
      });
      return;
    }

    if (!newLinkUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      const response = await addLink(researchId, newLinkUrl, newLinkType);
      if (!response.success || !response.data) {
        toast({
          title: "Error",
          description: response.message || "Failed to add link",
          variant: "destructive",
        });
        return;
      }

      setResearch(response.data);
      setNewLinkUrl("");
      toast({ title: "Success", description: "Link added successfully" });
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAnalysisComplete = (analysis: any) => {
    if (!research) return;

    const updatedLinks = research.links.map((link) =>
      link.url === analysis.url
        ? { ...link, analysis: analysis.analysis, type: analysis.contentType }
        : link,
    );

    setResearch({ ...research, links: updatedLinks });
  };

  const handleGenerateVoice = async () => {
    if (!researchId) {
      toast({
        title: "Error",
        description: "Missing research id in route",
        variant: "destructive",
      });
      return;
    }

    if (!hasLLMCredentials) {
      toast({
        title: "Set API key first",
        description:
          "Save your LLM credentials in Step 1 before generating voice summary",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingVoice(true);

    try {
      const response = await generateVoiceSummary(
        researchId,
        llmCredentials.apiKey,
        llmCredentials.provider,
        llmCredentials.model,
        llmCredentials.provider === "custom"
          ? llmCredentials.baseUrl
          : undefined,
      );

      if (!response.success || !response.data?.script) {
        toast({
          title: "Error",
          description: response.message || "Failed to generate voice summary",
          variant: "destructive",
        });
        return;
      }

      setVoiceScript(response.data.script);
      setVoiceAudioSrc(null);
      setVoiceEngine(null);
      setVoiceStatusMessage(null);
      toast({
        title: "Voice summary generated",
        description: "Now click Play to hear it in a human voice.",
      });
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const stopVoicePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
  };

  const speakWithBrowserVoice = async (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return false;
    }

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    const readVoices = () => synth.getVoices();
    let voices = readVoices();

    if (!voices.length) {
      voices = await new Promise<SpeechSynthesisVoice[]>((resolve) => {
        const timeoutId = window.setTimeout(() => {
          resolve(readVoices());
        }, 1200);

        const handler = () => {
          window.clearTimeout(timeoutId);
          resolve(readVoices());
        };

        synth.addEventListener("voiceschanged", handler, { once: true });
      });
    }

    const preferredVoiceHints = [
      "Google US English",
      "Microsoft Aria",
      "Samantha",
      "Daniel",
    ];

    const selectedVoice =
      voices.find((voice) =>
        preferredVoiceHints.some((hint) =>
          voice.name.toLowerCase().includes(hint.toLowerCase()),
        ),
      ) || voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    synth.cancel();
    setVoiceEngine("browser");
    setVoiceStatusMessage(
      "Using local browser voice. Human voice API unavailable.",
    );
    setIsSpeaking(true);
    synth.speak(utterance);
    return true;
  };

  const handlePlayVoice = async () => {
    if (!voiceScript || !researchId) {
      toast({
        title: "No voice summary yet",
        description: "Generate voice summary first",
        variant: "destructive",
      });
      return;
    }

    stopVoicePlayback();
    setIsSynthesizingVoice(true);

    try {
      const response = await synthesizeVoiceSummary(researchId);
      if (!response.success || !response.data?.audioBase64) {
        throw new Error(response.message || "Human voice engine unavailable");
      }

      const src = `data:${response.data.mimeType};base64,${response.data.audioBase64}`;
      setVoiceAudioSrc(src);
      setVoiceEngine("elevenlabs");
      setVoiceStatusMessage("Playing with human voice engine.");

      if (audioRef.current) {
        audioRef.current.src = src;
        await audioRef.current.play();
        setIsSpeaking(true);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to play voice summary";
      const spoke = await speakWithBrowserVoice(voiceScript);
      if (!spoke) {
        toast({
          title: "Voice playback failed",
          description: message,
          variant: "destructive",
        });
        setVoiceStatusMessage(message);
        return;
      }

      toast({
        title: "Playing with browser voice",
        description: message,
      });
    } finally {
      setIsSynthesizingVoice(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!research) {
    return null;
  }

  const analyzedLinks = research.links.filter((link) => link.analysis?.summary);
  const canOpenInterview = hasLLMCredentials && analyzedLinks.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="p-6">
          <h1 className="text-3xl font-bold mb-3">{research.title}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">{research.field}</Badge>
            <Badge variant="outline">{research.difficulty}</Badge>
          </div>
          {research.description && (
            <p className="text-muted-foreground">{research.description}</p>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            <h3 className="text-lg font-semibold">
              Step 1: Save Your LLM Credentials
            </h3>
          </div>

          <p className="text-sm text-muted-foreground">
            This key is reused for analysis, interview generation, and interview
            feedback in this browser session.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Provider</label>
              <Select
                value={sessionProvider}
                onValueChange={handleLLMProviderChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LLM_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor="sessionModel"
                className="block text-sm font-medium mb-2"
              >
                Model
              </label>
              <Input
                id="sessionModel"
                value={sessionModel}
                onChange={(e) => setSessionModel(e.target.value)}
                placeholder={
                  LLM_PROVIDERS.find(
                    (provider) => provider.value === sessionProvider,
                  )?.placeholder
                }
              />
            </div>
          </div>

          {sessionProvider === "custom" && (
            <div>
              <label
                htmlFor="sessionBaseUrl"
                className="block text-sm font-medium mb-2"
              >
                Base URL (OpenAI-compatible)
              </label>
              <Input
                id="sessionBaseUrl"
                type="url"
                value={sessionBaseUrl}
                onChange={(e) => setSessionBaseUrl(e.target.value)}
                placeholder="https://your-endpoint.com/v1"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="sessionApiKey"
              className="block text-sm font-medium mb-2"
            >
              API Key
            </label>
            <Input
              id="sessionApiKey"
              type="password"
              value={sessionApiKey}
              onChange={(e) => setSessionApiKey(e.target.value)}
              placeholder="Your API key"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveCredentials}>Save Credentials</Button>
            <Button variant="outline" onClick={handleClearCredentials}>
              Clear
            </Button>
          </div>

          {hasLLMCredentials && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                Ready: {llmCredentials.provider}/{llmCredentials.model}. Stored
                locally on this device.
              </AlertDescription>
            </Alert>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Step 2: Add Research Link
              </h3>
              <form onSubmit={handleAddLink} className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/article"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  disabled={isUpdating}
                  className="flex-1"
                />
                <Select value={newLinkType} onValueChange={setNewLinkType}>
                  <SelectTrigger className="w-35">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="paper">Paper</SelectItem>
                    <SelectItem value="vlog">Vlog</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Adding..." : "Add"}
                </Button>
              </form>
            </Card>

            {hasLLMCredentials ? (
              <AnalysisForm
                researchWorkId={research._id}
                onAnalysisComplete={handleAnalysisComplete}
                sharedCredentials={{
                  provider: llmCredentials.provider,
                  model: llmCredentials.model,
                  apiKey: llmCredentials.apiKey,
                  baseUrl: llmCredentials.baseUrl,
                }}
              />
            ) : (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertDescription className="text-amber-800">
                  Save your LLM credentials in Step 1 before analyzing links.
                </AlertDescription>
              </Alert>
            )}

            {analyzedLinks.map((link, index) => (
              <AnalysisResult
                key={`${link.url}-${index}`}
                url={link.url}
                analysis={link.analysis!}
                type={link.type}
              />
            ))}

            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Voice Summary
              </h3>

              <p className="text-sm text-muted-foreground">
                Uses your saved local device credentials from Step 1. Playback
                prefers human voice synthesis.
              </p>

              <Button
                onClick={handleGenerateVoice}
                disabled={isGeneratingVoice}
                className="w-full"
              >
                {isGeneratingVoice ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Voice Summary"
                )}
              </Button>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handlePlayVoice}
                  disabled={!voiceScript || isSynthesizingVoice}
                  className="flex-1"
                >
                  {isSynthesizingVoice ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Preparing voice...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Play Voice
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={stopVoicePlayback}
                  disabled={!isSpeaking}
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </div>

              {voiceEngine && (
                <p className="text-xs text-muted-foreground">
                  Speaking engine:{" "}
                  {voiceEngine === "elevenlabs"
                    ? "Human voice engine"
                    : "Browser voice"}
                </p>
              )}

              {voiceStatusMessage && (
                <p className="text-xs text-muted-foreground">
                  {voiceStatusMessage}
                </p>
              )}

              <audio
                ref={audioRef}
                controls
                className="w-full"
                src={voiceAudioSrc || undefined}
                onPlay={() => setIsSpeaking(true)}
                onPause={() => setIsSpeaking(false)}
                onEnded={() => setIsSpeaking(false)}
              />

              {voiceScript && (
                <div className="rounded-md border p-4 bg-muted/40">
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {voiceScript}
                  </p>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Quick Stats</h3>
              <p className="text-sm text-muted-foreground">Total links</p>
              <p className="text-2xl font-bold mb-4">{research.links.length}</p>
              <p className="text-sm text-muted-foreground">Analyzed links</p>
              <p className="text-2xl font-bold">{analyzedLinks.length}</p>
            </Card>

            <Card className="p-4 space-y-3">
              <p className="text-sm font-medium">
                Step 3: Interview Generation
              </p>
              <Button
                className="w-full"
                disabled={!canOpenInterview}
                onClick={() => router.push(`/research/${researchId}/interview`)}
              >
                <Zap className="w-4 h-4 mr-2" />
                Generate Interview
              </Button>
              {!hasLLMCredentials && (
                <p className="text-xs text-muted-foreground">
                  Save credentials in Step 1 to continue.
                </p>
              )}
              {hasLLMCredentials && analyzedLinks.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Analyze at least one link to unlock interview generation.
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
