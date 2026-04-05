import { apiClient, ApiResponse } from "./api";

export interface VoiceSummary {
  _id: string;
  userId: string;
  researchWorkId: string;
  script: string;
  generatedAt: string;
  expiresAt: string;
}

export interface VoiceSynthesisResult {
  engine: "elevenlabs";
  mimeType: string;
  audioBase64: string;
  voiceId: string;
  modelId: string;
}

export async function generateVoiceSummary(
  researchWorkId: string,
  apiKey: string,
  provider: string,
  model: string,
  baseUrl?: string,
): Promise<ApiResponse<VoiceSummary>> {
  return apiClient.post<VoiceSummary>(`/voice/${researchWorkId}/generate`, {
    apiKey,
    provider,
    model,
    ...(baseUrl && { baseUrl }),
  });
}

export async function getVoiceSummary(
  researchWorkId: string,
): Promise<ApiResponse<VoiceSummary>> {
  return apiClient.get<VoiceSummary>(`/voice/${researchWorkId}`);
}

export async function deleteVoiceSummary(
  id: string,
): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/voice/${id}`);
}

export async function synthesizeVoiceSummary(
  researchWorkId: string,
  options?: {
    voiceId?: string;
    modelId?: string;
  },
): Promise<ApiResponse<VoiceSynthesisResult>> {
  return apiClient.post<VoiceSynthesisResult>(
    `/voice/${researchWorkId}/synthesize`,
    options || {},
  );
}
