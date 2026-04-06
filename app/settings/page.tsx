"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  useAppSettingsStore,
  useAuthStore,
  useLLMSessionStore,
} from "@/lib/store";
import { apiClient } from "@/lib/api";
import { Loader2, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";

const ANALYSIS_PROVIDERS = [
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

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    user,
    token,
    hasHydrated,
    setToken,
    setUser,
    logout,
  } = useAuthStore();
  const settings = useAppSettingsStore((state) => state.settings);
  const setSettings = useAppSettingsStore((state) => state.setSettings);
  const resetSettings = useAppSettingsStore((state) => state.resetSettings);
  const llmHasCredentials = useLLMSessionStore((state) => state.hasCredentials());
  const llmCredentials = useLLMSessionStore((state) => state.credentials);
  const clearLLMCredentials = useLLMSessionStore((state) => state.clearCredentials);

  const hasRedirectedRef = useRef(false);

  const [displayFirstName, setDisplayFirstName] = useState("");
  const [displayLastName, setDisplayLastName] = useState("");

  const [defaultProvider, setDefaultProvider] = useState(
    settings.defaultAnalysisProvider,
  );
  const [defaultModel, setDefaultModel] = useState(settings.defaultAnalysisModel);
  const [defaultBaseUrl, setDefaultBaseUrl] = useState(
    settings.defaultAnalysisBaseUrl,
  );
  const [defaultEvidenceMode, setDefaultEvidenceMode] = useState(
    settings.defaultEvidenceMode,
  );
  const [autoOpenEvidenceSections, setAutoOpenEvidenceSections] = useState(
    settings.autoOpenEvidenceSections,
  );

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);

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
    }
  }, [hasHydrated, token, setToken]);

  useEffect(() => {
    setDisplayFirstName(user?.firstName || "");
    setDisplayLastName(user?.lastName || "");
  }, [user?.firstName, user?.lastName]);

  useEffect(() => {
    setDefaultProvider(settings.defaultAnalysisProvider);
    setDefaultModel(settings.defaultAnalysisModel);
    setDefaultBaseUrl(settings.defaultAnalysisBaseUrl);
    setDefaultEvidenceMode(settings.defaultEvidenceMode);
    setAutoOpenEvidenceSections(settings.autoOpenEvidenceSections);
  }, [
    settings.defaultAnalysisProvider,
    settings.defaultAnalysisModel,
    settings.defaultAnalysisBaseUrl,
    settings.defaultEvidenceMode,
    settings.autoOpenEvidenceSections,
  ]);

  const providerMeta = useMemo(
    () =>
      ANALYSIS_PROVIDERS.find((provider) => provider.value === defaultProvider) ||
      ANALYSIS_PROVIDERS[3],
    [defaultProvider],
  );

  const handleProfileSave = () => {
    if (!user) return;

    setIsSavingProfile(true);

    const nextFirstName = displayFirstName.trim();
    const nextLastName = displayLastName.trim();

    setUser({
      ...user,
      firstName: nextFirstName,
      lastName: nextLastName,
    });

    setIsSavingProfile(false);

    toast({
      title: "Profile updated",
      description: "Display name has been saved on this device.",
    });
  };

  const handleDefaultsSave = () => {
    if (!defaultProvider.trim() || !defaultModel.trim()) {
      toast({
        title: "Missing defaults",
        description: "Provider and model are required for analysis defaults.",
        variant: "destructive",
      });
      return;
    }

    if (defaultProvider === "custom" && !defaultBaseUrl.trim()) {
      toast({
        title: "Missing custom base URL",
        description: "Base URL is required when provider is custom.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingDefaults(true);

    setSettings({
      defaultAnalysisProvider: defaultProvider,
      defaultAnalysisModel: defaultModel.trim(),
      defaultAnalysisBaseUrl:
        defaultProvider === "custom" ? defaultBaseUrl.trim() : "",
      defaultEvidenceMode,
      autoOpenEvidenceSections,
    });

    setIsSavingDefaults(false);

    toast({
      title: "Defaults saved",
      description: "New analysis defaults are now active.",
    });
  };

  const handleResetDefaults = () => {
    resetSettings();
    toast({
      title: "Settings reset",
      description: "Defaults restored to recommended baseline values.",
    });
  };

  const handleClearCredentials = () => {
    clearLLMCredentials();
    toast({
      title: "Credentials cleared",
      description: "Saved LLM credentials were removed from this device.",
    });
  };

  const handleLogout = () => {
    apiClient.clearToken();
    logout();
    router.push("/login");
  };

  if (!hasHydrated || !token || !user) {
    return null;
  }

  return (
    <div className="research-detail-shell min-h-screen">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card className="research-detail-card p-6 reveal-up">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="auth-signup-chip auth-signup-chip-inline">Workspace Settings</p>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground mt-2">
                Control your local profile, analysis defaults, and session security.
              </p>
            </div>
            <Badge variant="secondary">Account: {user.email}</Badge>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="research-detail-card p-6 space-y-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Profile</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayFirstName">First Name</Label>
                <Input
                  id="displayFirstName"
                  value={displayFirstName}
                  onChange={(e) => setDisplayFirstName(e.target.value)}
                  className="bg-background/80"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayLastName">Last Name</Label>
                <Input
                  id="displayLastName"
                  value={displayLastName}
                  onChange={(e) => setDisplayLastName(e.target.value)}
                  className="bg-background/80"
                />
              </div>
            </div>

            <Button onClick={handleProfileSave} disabled={isSavingProfile}>
              {isSavingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving profile...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>

            <Alert>
              <AlertTitle>Profile scope</AlertTitle>
              <AlertDescription>
                Profile display name updates are stored locally and reflected across the app navbar.
              </AlertDescription>
            </Alert>
          </Card>

          <Card className="research-detail-card p-6 space-y-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Analysis Defaults</h2>
            </div>

            <div className="space-y-2">
              <Label>Default Provider</Label>
              <Select value={defaultProvider} onValueChange={setDefaultProvider}>
                <SelectTrigger className="bg-background/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANALYSIS_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultModel">Default Model</Label>
              <Input
                id="defaultModel"
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                placeholder={providerMeta.placeholder}
                className="bg-background/80"
              />
            </div>

            {defaultProvider === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="defaultBaseUrl">Default Base URL</Label>
                <Input
                  id="defaultBaseUrl"
                  type="url"
                  value={defaultBaseUrl}
                  onChange={(e) => setDefaultBaseUrl(e.target.value)}
                  placeholder="https://your-endpoint.com/v1"
                  className="bg-background/80"
                />
              </div>
            )}

            <div className="space-y-3 rounded-lg border p-4 bg-background/70">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Default Evidence-Locked Mode</p>
                  <p className="text-xs text-muted-foreground">
                    New analysis forms start with evidence lock enabled/disabled.
                  </p>
                </div>
                <Switch
                  checked={defaultEvidenceMode}
                  onCheckedChange={setDefaultEvidenceMode}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Auto-open evidence sections</p>
                  <p className="text-xs text-muted-foreground">
                    Evidence panels in analysis results open by default.
                  </p>
                </div>
                <Switch
                  checked={autoOpenEvidenceSections}
                  onCheckedChange={setAutoOpenEvidenceSections}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleDefaultsSave} disabled={isSavingDefaults}>
                {isSavingDefaults ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving defaults...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Defaults
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleResetDefaults}>
                Reset Defaults
              </Button>
            </div>
          </Card>
        </div>

        <Card className="research-detail-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Session Security</h2>

          <div className="rounded-md border bg-background/70 p-4">
            <p className="text-sm font-medium">Stored LLM credentials</p>
            <p className="text-xs text-muted-foreground mt-1">
              {llmHasCredentials
                ? `${llmCredentials.provider}/${llmCredentials.model}`
                : "No saved credentials on this device"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleClearCredentials}>
                Clear LLM Credentials
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                Logout Everywhere (This Device)
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
