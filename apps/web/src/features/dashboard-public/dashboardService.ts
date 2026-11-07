import { apiClient } from '../../shared/api/apiClient'

export interface PublicStats {
  activeProjects: number
  activeTeams: number
}

export function getPublicStats(): Promise<PublicStats> {
  return apiClient<PublicStats>('/public-stats')
}
