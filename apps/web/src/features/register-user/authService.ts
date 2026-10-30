import { apiClient } from '../../shared/api/apiClient'

export interface RegisterData {
  email: string
  password: string
}

export interface RegisteredUser {
  id: string
  email: string
}

// La API expone el registro en POST /users.
export function register(data: RegisterData): Promise<RegisteredUser> {
  return apiClient<RegisteredUser>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
