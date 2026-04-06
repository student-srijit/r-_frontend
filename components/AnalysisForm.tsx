"use client";

import { useEffect, useState } from "react";
import { analyzeLink } from "@/lib/research";
import { useAppSettingsStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AnalysisFormProps {
  researchWorkId: string;
  onAnalysisComplete?: (analysis: any) => void;
  sharedCredentials?: {
    provider: string;
    model: string;
    apiKey: string;
    baseUrl?: string;
  };
}

const PROVIDERS = [
  {
    value: "openai",
    label: "OpenAI",
    placeholder: "gpt-4o-mini",
    keyHint: "platform.openai.com/api-keys",
  },
  {
    value: "anthropic",
    label: "Anthropic",
    placeholder: "claude-3-haiku-20240307",
    keyHint: "console.anthropic.com/settings/keys",
  },
  {
    value: "gemini",
    label: "Google Gemini",
    placeholder: "gemini-1.5-flash",
    keyHint: "aistudio.google.com/app/apikey",
  },
  {
    value: "groq",
    label: "Groq",
    placeholder: "llama-3.3-70b-versatile",
    keyHint: "console.groq.com/keys",
  },
  {
    value: "together",
    label: "Together.ai",
    placeholder: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    keyHint: "api.together.ai/settings/api-keys",
  },
  {
    value: "deepinfra",
    label: "DeepInfra",
    placeholder: "meta-llama/Meta-Llama-3.1-70B-Instruct",
    keyHint: "deepinfra.com/dash",
  },
  {
    value: "openrouter",
    label: "OpenRouter",
    placeholder: "openai/gpt-4o-mini",
    keyHint: "openrouter.ai/keys",
  },
  {
    value: "mistral",
    label: "Mistral",
    placeholder: "mistral-small-latest",
    keyHint: "console.mistral.ai/api-keys",
  },
  {
    value: "perplexity",
    label: "Perplexity",
    placeholder: "llama-3.1-sonar-small-128k-online",
    keyHint: "perplexity.ai/settings/api",
  },
  {
    value: "custom",
    label: "Custom (OpenAI-compat)",
    placeholder: "your-model-name",
    keyHint: "",
  },
];

export function AnalysisForm({
  researchWorkId,
  onAnalysisComplete,
  sharedCredentials,
}: AnalysisFormProps) {
  const { toast } = useToast();
  const settings = useAppSettingsStore((state) => state.settings);
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState(settings.defaultAnalysisProvider);
  const [model, setModel] = useState(settings.defaultAnalysisModel);
  const [baseUrl, setBaseUrl] = useState(settings.defaultAnalysisBaseUrl);
  const [evidenceMode, setEvidenceMode] = useState(
    settings.defaultEvidenceMode,
  );

  useEffect(() => {
    if (sharedCredentials) {
      return;
    }

    setProvider(settings.defaultAnalysisProvider);
    setModel(settings.defaultAnalysisModel);
    setBaseUrl(settings.defaultAnalysisBaseUrl);
    setEvidenceMode(settings.defaultEvidenceMode);
  }, [
    sharedCredentials,
    settings.defaultAnalysisProvider,
    settings.defaultAnalysisModel,
    settings.defaultAnalysisBaseUrl,
    settings.defaultEvidenceMode,
  ]);

  const selectedProvider =
    PROVIDERS.find((p) => p.value === provider) || PROVIDERS[3];

  const handleProviderChange = (val: string) => {
    setProvider(val);
    const prov = PROVIDERS.find((p) => p.value === val);
    if (prov) {
      setModel(prov.placeholder);
    }
    if (val !== "custom") {
      setBaseUrl("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const effectiveProvider = sharedCredentials?.provider ?? provider;
    const effectiveModel = sharedCredentials?.model ?? model;
    const effectiveApiKey = sharedCredentials?.apiKey ?? apiKey;
    const effectiveBaseUrl = sharedCredentials?.baseUrl ?? baseUrl;

    if (!url.trim() || !effectiveApiKey.trim() || !effectiveModel.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter URL, model, and API key",
        variant: "destructive",
      });
      return;
    }

    if (effectiveProvider === "custom" && !effectiveBaseUrl.trim()) {
      toast({
        title: "Missing base URL",
        description: "A base URL is required for custom provider",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await analyzeLink(
        researchWorkId,
        url,
        effectiveApiKey,
        effectiveProvider,
        effectiveModel,
        evidenceMode,
        effectiveProvider === "custom" ? effectiveBaseUrl : undefined,
      );

      if (!response.success) {
        toast({
          title: "Analysis failed",
          description: response.message || "Could not analyze the link",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Analysis complete",
        description: "Link has been analyzed successfully",
      });

      if (onAnalysisComplete) {
        onAnalysisComplete(response.data);
      }

      setUrl("");
      if (!sharedCredentials) {
        setApiKey("");
      }
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

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Analyze a Link</h3>

      <Alert className="mb-6 border-orange-200 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          Your API key is stored locally on your device for reuse and is never
          stored in our database. Enable Evidence-Locked mode to force
          source-backed quotes for each analysis.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-2">
            Link URL
          </label>
          <Input
            id="url"
            type="url"
            placeholder="https://arxiv.org/abs/2301.00001 or YouTube/blog URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/40">
          <div>
            <p className="text-sm font-medium">Evidence-Locked Mode</p>
            <p className="text-xs text-muted-foreground">
              Requires verifiable source quotes linked to each key claim.
            </p>
          </div>
          <Switch
            checked={evidenceMode}
            onCheckedChange={setEvidenceMode}
            disabled={isLoading}
            aria-label="Toggle evidence lock mode"
          />
        </div>

        {sharedCredentials ? (
          <div className="rounded-md border p-3 bg-muted/40">
            <p className="text-sm font-medium">
              Using saved local device credentials
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {sharedCredentials.provider}/{sharedCredentials.model}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  LLM Provider
                </label>
                <Select
                  value={provider}
                  onValueChange={handleProviderChange}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label
                  htmlFor="model"
                  className="block text-sm font-medium mb-2"
                >
                  Model Name
                </label>
                <Input
                  id="model"
                  type="text"
                  placeholder={selectedProvider.placeholder}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {provider === "custom" && (
              <div>
                <label
                  htmlFor="baseUrl"
                  className="block text-sm font-medium mb-2"
                >
                  Base URL (OpenAI-compatible endpoint)
                </label>
                <Input
                  id="baseUrl"
                  type="url"
                  placeholder="https://your-endpoint.com/v1"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            )}

            <div>
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium mb-2"
              >
                API Key
              </label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isLoading}
                required
              />
              {selectedProvider.keyHint && (
                <p className="text-xs text-muted-foreground mt-1">
                  Get from{" "}
                  <a
                    href={`https://${selectedProvider.keyHint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {selectedProvider.keyHint}
                  </a>
                </p>
              )}
            </div>
          </>
        )}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Link"
          )}
        </Button>
      </form>
    </Card>
  );
}
