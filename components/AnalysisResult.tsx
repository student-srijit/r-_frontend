"use client";

import { useState } from "react";
import { Link as LinkIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  const handleCopySummary = async () => {
    await navigator.clipboard.writeText(analysis.summary || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const summaryParagraphs = analysis.summary
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const keyPoints = analysis.keyPoints || [];
  const evidence = analysis.evidence || [];
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
            <details open className="rounded-lg border p-3 bg-muted/40">
              <summary className="cursor-pointer text-sm font-semibold">
                Evidence-Locked Citations ({evidence.length})
              </summary>
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
