import { apiClient } from '../../shared/api/apiClient'

export interface RegisterData {
  correo: string
  clave: string
}

export interface RegisteredUser {
  id: string
  correo: string
}

// La API expone el registro en POST /usuarios.
export function register(data: RegisterData): Promise<RegisteredUser> {
  return apiClient<RegisteredUser>('/usuarios', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
