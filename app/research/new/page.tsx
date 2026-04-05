"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createResearchWork, addLink } from "@/lib/research";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
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
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-8">Create New Research Work</h1>

          {formError && (
            <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title *
              </label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Deep Learning in Computer Vision"
                value={formData.title}
                onChange={handleChange}
                minLength={5}
                required
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Minimum 5 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-2"
              >
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Briefly describe this research..."
                value={formData.description}
                onChange={handleChange}
                rows={4}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="field"
                  className="block text-sm font-medium mb-2"
                >
                  Field *
                </label>
                <Select
                  value={formData.field}
                  onValueChange={(value) => handleSelectChange("field", value)}
                >
                  <SelectTrigger>
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

              <div>
                <label
                  htmlFor="difficulty"
                  className="block text-sm font-medium mb-2"
                >
                  Difficulty
                </label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) =>
                    handleSelectChange("difficulty", value)
                  }
                >
                  <SelectTrigger>
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

            <div>
              <label htmlFor="tags" className="block text-sm font-medium mb-2">
                Tags (comma-separated)
              </label>
              <Input
                id="tags"
                name="tags"
                placeholder="e.g., neural-networks, python, tensorflow"
                value={formData.tags}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-2">
                Notes
              </label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Add any personal notes..."
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <h2 className="text-sm font-semibold">
                Research Link (optional)
              </h2>
              <p className="text-xs text-muted-foreground">
                Paste your paper/article URL here to add it immediately after
                creating this research work.
              </p>

              <Input
                id="initialUrl"
                name="initialUrl"
                type="url"
                placeholder="https://arxiv.org/abs/..."
                value={formData.initialUrl}
                onChange={handleChange}
                disabled={isLoading}
              />

              <div>
                <label
                  htmlFor="initialUrlType"
                  className="block text-sm font-medium mb-2"
                >
                  Link Type
                </label>
                <Select
                  value={formData.initialUrlType}
                  onValueChange={(value) =>
                    handleSelectChange("initialUrlType", value)
                  }
                >
                  <SelectTrigger>
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

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Creating..." : "Create Research Work"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
