import { apiClient } from '../../shared/api/apiClient'

export interface ChallengeSubmission {
  mode: 'guiado' | 'libre'
  title: string
  description: string
  additionalContext?: string
}

export interface Challenge extends ChallengeSubmission {
  id: string
}

export function submitChallenge(data: ChallengeSubmission): Promise<Challenge> {
  return apiClient<Challenge>('/challenges', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
