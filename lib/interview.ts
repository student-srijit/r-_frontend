import { apiClient, ApiResponse } from "./api";

export type InterviewMode = "practice" | "test" | "video";

export interface InterviewQuestion {
  id: string;
  question: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  hints: string[];
  generatedAt: string;
}

export interface InterviewAnswer {
  questionId: string;
  answer: string;
  feedback: string;
  answerType?: "text" | "video";
  videoDurationSec?: number | null;
  transcriptSource?: "manual" | "speech_recognition" | "unknown";
  submittedAt: string;
}

export interface InterviewTestConfig {
  durationMinutes?: number | null;
  startedAt?: string | null;
  endsAt?: string | null;
}

export interface Interview {
  _id: string;
  userId: string;
  researchWorkId: string;
  company: string;
  mode?: InterviewMode;
  difficulty: "easy" | "medium" | "hard";
  questions: InterviewQuestion[];
  userAnswers: InterviewAnswer[];
  testConfig?: InterviewTestConfig;
  status: "in_progress" | "completed";
  createdAt: string;
  completedAt?: string;
}

export interface GeneratedInterviewResponse {
  interviewId: string;
  company: string;
  mode?: InterviewMode;
  difficulty: "easy" | "medium" | "hard";
  recommendedDifficulty?: "easy" | "medium" | "hard";
  questions: InterviewQuestion[];
  testConfig?: InterviewTestConfig;
}

export interface CompanyInterviewHistoryResponse {
  company: string;
  attempts: number;
  completedAttempts: number;
  completionRate: number;
  recommendedDifficulty: "easy" | "medium" | "hard";
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  modeDistribution: {
    practice: number;
    test: number;
    video: number;
  };
  recentQuestions: Array<{
    interviewId: string;
    researchWorkId: string | null;
    researchTitle: string | null;
    questionId: string;
    question: string;
    topic: string;
    difficulty: "easy" | "medium" | "hard";
    createdAt: string;
  }>;
}

export const COMPANY_DIFFICULTY: Record<string, "easy" | "medium" | "hard"> = {
  // Hard companies (FAANG+ / top-tier)
  Google: "hard",
  Meta: "hard",
  Microsoft: "hard",
  Apple: "hard",
  Amazon: "hard",
  Netflix: "hard",
  Stripe: "hard",
  "Goldman Sachs": "hard",
  Citadel: "hard",
  Bloomberg: "hard",
  "Two Sigma": "hard",
  "Jane Street": "hard",
  Palantir: "hard",
  OpenAI: "hard",
  DeepMind: "hard",
  // Medium companies
  Uber: "medium",
  Airbnb: "medium",
  LinkedIn: "medium",
  Twitter: "medium",
  Snap: "medium",
  Dropbox: "medium",
  Salesforce: "medium",
  Adobe: "medium",
  Shopify: "medium",
  Atlassian: "medium",
  VMware: "medium",
  Oracle: "medium",
  SAP: "medium",
  // Entry-level / service companies
  TCS: "easy",
  Infosys: "easy",
  Wipro: "easy",
  HCL: "easy",
  "Tech Mahindra": "easy",
  Accenture: "easy",
  Cognizant: "easy",
  Capgemini: "easy",
  IBM: "easy",
  Mphasis: "easy",
};

export async function generateInterview(data: {
  researchWorkId: string;
  company: string;
  customDifficulty?: "easy" | "medium" | "hard";
  mode?: InterviewMode;
  testDurationMinutes?: number;
  apiKey: string;
  provider: string;
  model: string;
  baseUrl?: string;
}): Promise<ApiResponse<GeneratedInterviewResponse>> {
  return apiClient.post<GeneratedInterviewResponse>(
    "/interviews/generate",
    data,
  );
}

export async function getInterview(
  id: string,
): Promise<ApiResponse<Interview>> {
  return apiClient.get<Interview>(`/interviews/${id}`);
}

export async function getUserInterviews(
  page = 1,
  limit = 10,
  status?: string,
): Promise<ApiResponse<{ data: Interview[]; pagination: any }>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
  });
  return apiClient.get<{ data: Interview[]; pagination: any }>(
    `/interviews?${params}`,
  );
}

export async function submitAnswer(
  interviewId: string,
  questionId: string,
  answer: string,
  apiKey: string,
  provider: string,
  model: string,
  baseUrl?: string,
  options?: {
    answerType?: "text" | "video";
    videoDurationSec?: number;
    transcriptSource?: "manual" | "speech_recognition" | "unknown";
  },
): Promise<ApiResponse<any>> {
  return apiClient.post<any>(`/interviews/${interviewId}/answer`, {
    questionId,
    answer,
    apiKey,
    provider,
    model,
    ...(baseUrl && { baseUrl }),
    ...(options?.answerType && { answerType: options.answerType }),
    ...(Number.isFinite(options?.videoDurationSec)
      ? { videoDurationSec: options?.videoDurationSec }
      : {}),
    ...(options?.transcriptSource && {
      transcriptSource: options.transcriptSource,
    }),
  });
}

export async function completeInterview(
  id: string,
): Promise<ApiResponse<Interview>> {
  return apiClient.post<Interview>(`/interviews/${id}/complete`);
}

export async function getCompanyInterviewHistory(
  company: string,
  researchWorkId?: string,
  limit = 20,
): Promise<ApiResponse<CompanyInterviewHistoryResponse>> {
  const params = new URLSearchParams({
    company,
    limit: String(limit),
    ...(researchWorkId ? { researchWorkId } : {}),
  });

  return apiClient.get<CompanyInterviewHistoryResponse>(
    `/interviews/history/company?${params}`,
  );
}
