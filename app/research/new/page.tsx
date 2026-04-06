"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createResearchWork, addLink } from "@/lib/research";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RESEARCH_FIELDS_LIST = [
  "AI",
  "Machine Learning",
  "Deep Learning",
  "Natural Language Processing",
  "Computer Vision",
  "Blockchain",
  "Web Development",
  "Cloud Computing",
  "DevOps",
  "Cybersecurity",
  "Data Science",
  "Other",
];

export default function NewResearchPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    field: "Other",
    difficulty: "intermediate",
    notes: "",
    tags: "",
    initialUrl: "",
    initialUrlType: "paper",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const trimmedTitle = formData.title.trim();
    if (trimmedTitle.length < 5) {
      const message = "Title must be at least 5 characters long";
      setFormError(message);
      toast({
        title: "Validation error",
        description: message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await createResearchWork({
        title: trimmedTitle,
        description: formData.description,
        field: formData.field,
        difficulty: formData.difficulty,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        notes: formData.notes,
      });

      if (!response.success) {
        const message = response.message || "Failed to create research work";
        setFormError(message);
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
        return;
      }

      if (formData.initialUrl.trim() && response.data?._id) {
        const linkResponse = await addLink(
          response.data._id,
          formData.initialUrl.trim(),
          formData.initialUrlType,
        );

        if (!linkResponse.success) {
          toast({
            title: "Research created, but link was not added",
            description:
              linkResponse.message || "Please add the link on the next page",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Success",
        description: formData.initialUrl.trim()
          ? "Research work created and link added"
          : "Research work created",
      });

      router.push(`/research/${response.data?._id}`);
    } catch {
      const message = "An unexpected error occurred";
      setFormError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="research-gateway-shell min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <section className="research-gateway-hero reveal-up">
          <div>
            <p className="auth-signup-chip auth-signup-chip-inline">Research Gateway</p>
            <h1 className="research-gateway-title">Design your next deep-dive research workspace.</h1>
            <p className="research-gateway-copy">
              Structure your topic, attach source links, and generate a focused base for analysis, discussions, and interview preparation.
            </p>
          </div>
          <div className="research-gateway-hero-image" />
        </section>

        <div className="research-gateway-grid mt-6">
          <Card className="research-gateway-form-card reveal-up">
            <div className="p-6 sm:p-8">
              {formError && (
                <div className="mb-5 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Deep Learning in Computer Vision"
                    value={formData.title}
                    onChange={handleChange}
                    minLength={5}
                    required
                    disabled={isLoading}
                    className="h-11 bg-background/80"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Minimum 5 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Briefly describe this research..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    disabled={isLoading}
                    className="bg-background/80"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="field">Field *</Label>
                    <Select
                      value={formData.field}
                      onValueChange={(value) => handleSelectChange("field", value)}
                    >
                      <SelectTrigger className="h-11 bg-background/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESEARCH_FIELDS_LIST.map((field) => (
                          <SelectItem key={field} value={field}>
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value) =>
                        handleSelectChange("difficulty", value)
                      }
                    >
                      <SelectTrigger className="h-11 bg-background/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    placeholder="e.g., neural-networks, python, tensorflow"
                    value={formData.tags}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-11 bg-background/80"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Add any personal notes..."
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    disabled={isLoading}
                    className="bg-background/80"
                  />
                </div>

                <div className="space-y-3 rounded-xl border border-border/80 bg-background/70 p-4">
                  <h2 className="text-sm font-semibold">Research Link (optional)</h2>
                  <p className="text-xs text-muted-foreground">
                    Paste your paper or article URL to attach it immediately after creating the workspace.
                  </p>

                  <Input
                    id="initialUrl"
                    name="initialUrl"
                    type="url"
                    placeholder="https://arxiv.org/abs/..."
                    value={formData.initialUrl}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-11 bg-background/80"
                  />

                  <div className="space-y-2">
                    <Label htmlFor="initialUrlType">Link Type</Label>
                    <Select
                      value={formData.initialUrlType}
                      onValueChange={(value) =>
                        handleSelectChange("initialUrlType", value)
                      }
                    >
                      <SelectTrigger className="h-11 bg-background/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paper">Paper</SelectItem>
                        <SelectItem value="blog">Blog</SelectItem>
                        <SelectItem value="vlog">Vlog</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="auth-signup-button h-11 flex-1"
                  >
                    {isLoading ? "Creating..." : "Create Research Work"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                    className="h-11"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </Card>

          <aside className="research-gateway-side reveal-up hidden xl:block">
            <Card className="research-gateway-side-card p-5">
              <h2 className="text-lg font-semibold">What makes a strong research brief?</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Define a narrow technical question in your title.</li>
                <li>Capture context and why this topic matters now.</li>
                <li>Attach at least one canonical source link to start analysis.</li>
              </ul>
            </Card>
            <Card className="research-gateway-side-card mt-4 overflow-hidden p-0">
              <div className="research-gateway-side-image" />
              <div className="p-4">
                <h3 className="text-sm font-semibold">From idea to interview-ready</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  This workspace feeds your analysis pipeline, discovery ranking, and interview simulations.
                </p>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
