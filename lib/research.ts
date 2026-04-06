import { apiClient, ApiResponse } from "./api";

export interface Link {
  _id?: string;
  url: string;
  type: "blog" | "paper" | "vlog" | "other";
  addedAt?: string;
  analysis?: {
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
    analyzedAt: string;
    modelUsed: string;
  };
}

export interface ResearchWork {
  _id: string;
  userId: string;
  title: string;
  description: string;
  links: Link[];
  tags: string[];
  field: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export async function createResearchWork(data: {
  title: string;
  description?: string;
  field?: string;
  difficulty?: string;
  tags?: string[];
  notes?: string;
}): Promise<ApiResponse<ResearchWork>> {
  return apiClient.post<ResearchWork>("/research", data);
}

export async function getResearchWorks(
  page = 1,
  limit = 10,
  filters?: { field?: string; difficulty?: string },
): Promise<ApiResponse<{ data: ResearchWork[]; pagination: any }>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters,
  });
  return apiClient.get<{ data: ResearchWork[]; pagination: any }>(
    `/research?${params}`,
  );
}

export async function getResearchWork(
  id: string,
): Promise<ApiResponse<ResearchWork>> {
  return apiClient.get<ResearchWork>(`/research/${id}`);
}

export async function updateResearchWork(
  id: string,
  data: Partial<ResearchWork>,
): Promise<ApiResponse<ResearchWork>> {
  return apiClient.put<ResearchWork>(`/research/${id}`, data);
}

export async function deleteResearchWork(
  id: string,
): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/research/${id}`);
}

export async function addLink(
  researchWorkId: string,
  url: string,
  type: string,
): Promise<ApiResponse<ResearchWork>> {
  return apiClient.post<ResearchWork>(`/research/${researchWorkId}/links`, {
    url,
    type,
  });
}

export async function analyzeLink(
  researchWorkId: string,
  linkUrl: string,
  apiKey: string,
  provider: string,
  model: string,
  evidenceMode?: boolean,
  baseUrl?: string,
): Promise<ApiResponse<any>> {
  return apiClient.post<any>("/analyze/link", {
    researchWorkId,
    linkUrl,
    apiKey,
    provider,
    model,
    evidenceMode: Boolean(evidenceMode),
    ...(baseUrl && { baseUrl }),
  });
}

export interface Flashcard {
  question: string;
  answer: string;
}

export async function generateFlashcards(
  researchWorkId: string,
  apiKey: string,
  provider: string,
  model: string,
  baseUrl?: string,
): Promise<ApiResponse<Flashcard[]>> {
  return apiClient.post<Flashcard[]>(`/research/${researchWorkId}/flashcards`, {
    apiKey,
    provider,
    model,
    ...(baseUrl && { baseUrl }),
  });
}
