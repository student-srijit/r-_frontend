"use client";

import { useState } from "react";
import { FileDown, Link as LinkIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAppSettingsStore } from "@/lib/store";

interface AnalysisResultProps {
  url: string;
  type: string;
  analysis: {
    summary: string;
    keyPoints: string[];
    evidence?: Array<{
      claim: string;
      quote: string;
      sourceUrl?: string;
      confidence?: "high" | "medium" | "low";
    }>;
    importantConcepts?: string[];
    practicalApplications?: string[];
    discussionQuestions?: string[];
  };
  onDelete?: () => void;
}

export function AnalysisResult({
  url,
  type,
  analysis,
  onDelete,
}: AnalysisResultProps) {
  const [copied, setCopied] = useState(false);
  const autoOpenEvidenceSections = useAppSettingsStore(
    (state) => state.settings.autoOpenEvidenceSections,
  );

  const confidenceWeights: Record<"high" | "medium" | "low", number> = {
    high: 1,
    medium: 0.72,
    low: 0.45,
  };

  const handleCopySummary = async () => {
    await navigator.clipboard.writeText(analysis.summary || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const buildEvidenceReport = () => {
    const sections: string[] = [];

    sections.push(`# RSA Evidence Report`);
    sections.push(``);
    sections.push(`- Source URL: ${url}`);
    sections.push(`- Content Type: ${type}`);
    sections.push(`- Generated At: ${new Date().toISOString()}`);
    sections.push(
      `- Evidence Strength Score: ${evidenceStrengthScore !== null ? `${evidenceStrengthScore}/100` : "N/A"}`,
    );
    sections.push(``);
    sections.push(`## Summary`);
    sections.push(analysis.summary || "No summary available.");
    sections.push(``);

    if (keyPoints.length > 0) {
      sections.push(`## Key Points`);
      keyPoints.forEach((point) => sections.push(`- ${point}`));
      sections.push(``);
    }

    if (evidence.length > 0) {
      sections.push(`## Evidence-Locked Citations`);
      evidence.forEach((item, index) => {
        sections.push(`### Evidence ${index + 1}`);
        sections.push(`- Claim: ${item.claim}`);
        sections.push(`- Confidence: ${item.confidence || "medium"}`);
        sections.push(`- Quote: "${item.quote}"`);
        sections.push(`- Source: ${item.sourceUrl || url}`);
        sections.push(``);
      });
    }

    return sections.join("\n");
  };

  const handleExportReport = () => {
    if (!evidence.length) return;

    const markdown = buildEvidenceReport();
    const blob = new Blob([markdown], {
      type: "text/markdown;charset=utf-8",
    });
    const fileUrl = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    const sourceSlug = url
      .replace(/^https?:\/\//, "")
      .replace(/[^a-zA-Z0-9.-]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80)
      .replace(/^-|-$/g, "");

    anchor.href = fileUrl;
    anchor.download = `rsa-evidence-report-${sourceSlug || "source"}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(fileUrl);
  };

  const summaryParagraphs = analysis.summary
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const keyPoints = analysis.keyPoints || [];
  const evidence = analysis.evidence || [];
  const evidenceScoreRaw =
    evidence.length > 0
      ? evidence.reduce((sum, item) => {
          const confidence = item.confidence || "medium";
          return sum + confidenceWeights[confidence];
        }, 0) / evidence.length
      : null;
  const evidenceStrengthScore =
    evidenceScoreRaw !== null ? Math.round(evidenceScoreRaw * 100) : null;
  const importantConcepts = analysis.importantConcepts || [];
  const practicalApplications = analysis.practicalApplications || [];
  const discussionQuestions = analysis.discussionQuestions || [];

  return (
    <Card className="p-6 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <LinkIcon className="w-4 h-4 text-muted-foreground" />
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm break-all"
            >
              {url}
            </a>
          </div>
          <Badge variant="outline" className="w-fit">
            {type}
          </Badge>
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Detailed Summary</h4>
            <Button variant="outline" size="sm" onClick={handleCopySummary}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="space-y-2">
            {summaryParagraphs.map((paragraph, idx) => (
              <p
                key={idx}
                className="text-sm text-muted-foreground leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {keyPoints.length > 0 && (
          <div>
            <details open className="rounded-lg border p-3 bg-muted/40">
              <summary className="cursor-pointer text-sm font-semibold">
                Key Points ({keyPoints.length})
              </summary>
              <ul className="space-y-2 mt-3">
                {keyPoints.map((point, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-muted-foreground flex gap-2"
                  >
                    <span className="text-primary font-semibold">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}

        {evidence.length > 0 && (
          <div>
            <details
              open={autoOpenEvidenceSections}
              className="rounded-lg border p-3 bg-muted/40"
            >
              <summary className="cursor-pointer text-sm font-semibold">
                Evidence-Locked Citations ({evidence.length})
              </summary>
              <div className="mt-3 rounded-md border bg-background/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Evidence Strength</p>
                    <p className="text-xs text-muted-foreground">
                      Score based on citation confidence labels
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {evidenceStrengthScore !== null
                        ? `${evidenceStrengthScore}/100`
                        : "N/A"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportReport}
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                  </div>
                </div>
                <Progress
                  className="mt-3"
                  value={evidenceStrengthScore !== null ? evidenceStrengthScore : 0}
                />
              </div>
              <div className="space-y-3 mt-3">
                {evidence.map((item, idx) => (
                  <div key={idx} className="rounded-md border bg-background/70 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{item.claim}</p>
                      {item.confidence && (
                        <Badge variant="outline" className="text-xs">
                          {item.confidence}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      "{item.quote}"
                    </p>
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs text-primary hover:underline"
                      >
                        View source
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {importantConcepts.length > 0 && (
          <div>
            <details className="rounded-lg border p-3 bg-muted/40">
              <summary className="cursor-pointer text-sm font-semibold">
                Important Concepts ({importantConcepts.length})
              </summary>
              <ul className="space-y-2 mt-3">
                {importantConcepts.map((concept, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-muted-foreground flex gap-2"
                  >
                    <span className="text-primary font-semibold">•</span>
                    <span>{concept}</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}

        {practicalApplications.length > 0 && (
          <div>
            <details className="rounded-lg border p-3 bg-muted/40">
              <summary className="cursor-pointer text-sm font-semibold">
                Practical Applications ({practicalApplications.length})
              </summary>
              <ul className="space-y-2 mt-3">
                {practicalApplications.map((application, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-muted-foreground flex gap-2"
                  >
                    <span className="text-primary font-semibold">•</span>
                    <span>{application}</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}

        {discussionQuestions.length > 0 && (
          <div>
            <details className="rounded-lg border p-3 bg-muted/40">
              <summary className="cursor-pointer text-sm font-semibold">
                Discussion Questions ({discussionQuestions.length})
              </summary>
              <ol className="space-y-2 mt-3 list-decimal pl-5">
                {discussionQuestions.map((question, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">
                    {question}
                  </li>
                ))}
              </ol>
            </details>
          </div>
        )}
      </div>
    </Card>
  );
}
