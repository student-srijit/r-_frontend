import { apiClient, ApiResponse } from "./api";
import { ResearchWork } from "./research";

export interface RecommendationMeta {
  finalScore: number;
  affinityScore: number;
  globalMomentum: number;
  freshness: number;
  matchedField?: string | null;
  matchedTags?: string[];
  matchedKeywords?: string[];
}

export interface TrendingResearch {
  _id: string;
  researchWorkId: ResearchWork;
  views: number;
  shares: number;
  analyzedCount: number;
  field: string;
  score: number;
  updatedAt: string;
  recommendation?: RecommendationMeta;
}

export interface DiscoverResearchItem extends ResearchWork {
  recommendation?: RecommendationMeta;
}

export interface DiscoverFeedResponse<TItem> {
  items: TItem[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  personalization?: {
    status:
      | "anonymous"
      | "insufficient_signals"
      | "personalized"
      | "no_candidates";
    topInterestKeywords?: string[];
  };
}

export async function getTrendingResearch(
  page = 1,
  limit = 20,
  field?: string,
): Promise<ApiResponse<DiscoverFeedResponse<TrendingResearch>>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(field && { field }),
  });
  const response = await apiClient.get<TrendingResearch[]>(
    `/discover/trending?${params}`,
  );

  return {
    ...response,
    data: {
      items: response.data || [],
      pagination: response.pagination,
      personalization: response.personalization,
    },
  };
}

export async function discoverResearch(
  page = 1,
  limit = 20,
  filters?: {
    field?: string;
    difficulty?: string;
    searchTerm?: string;
  },
): Promise<ApiResponse<DiscoverFeedResponse<DiscoverResearchItem>>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters?.field && { field: filters.field }),
    ...(filters?.difficulty && { difficulty: filters.difficulty }),
    ...(filters?.searchTerm && { searchTerm: filters.searchTerm }),
  });
  const response = await apiClient.get<DiscoverResearchItem[]>(
    `/discover/discover?${params}`,
  );

  return {
    ...response,
    data: {
      items: response.data || [],
      pagination: response.pagination,
      personalization: response.personalization,
    },
  };
}

export async function getResearchFields(): Promise<ApiResponse<string[]>> {
  return apiClient.get<string[]>("/discover/fields");
}

export async function getResearchByField(
  field: string,
  page = 1,
  limit = 20,
): Promise<
  ApiResponse<{ data: ResearchWork[]; pagination: any; field: string }>
> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  return apiClient.get<{
    data: ResearchWork[];
    pagination: any;
    field: string;
  }>(`/discover/field/${field}?${params}`);
}

export async function incrementViews(
  researchWorkId: string,
): Promise<ApiResponse<void>> {
  return apiClient.post<void>(`/discover/${researchWorkId}/view`);
}

export async function shareResearch(
  researchWorkId: string,
): Promise<ApiResponse<void>> {
  return apiClient.post<void>(`/discover/${researchWorkId}/share`);
}
