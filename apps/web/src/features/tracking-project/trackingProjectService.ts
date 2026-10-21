import { apiClient } from "../../shared/api/apiClient";

export interface ChallengeStatus {
  id: string;
  status: string;
  progress: number;
}

export function getChallengeStatus(id: string): Promise<ChallengeStatus> {
  return apiClient<ChallengeStatus>(
    `/challenges/${encodeURIComponent(id)}/status`,
  );
}
