// Same-origin path: the Vite proxy (dev) and the Vercel rewrite (prod) forward /api to the API, so
// the session cookies are first-party and fetch sends them without `credentials: "include"`.
const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiClient<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (import.meta.env.DEV) {
    console.log(`[api] → ${init.method ?? 'GET'} ${API_URL}${path}`, maskSecrets(init.body))
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })

  const body = await response.json().catch(() => null)
  if (import.meta.env.DEV) {
    console.log(`[api] ← ${response.status} ${path}`, body)
  }
  if (!response.ok) {
    throw new ApiError(response.status, body?.error ?? response.statusText)
  }
  return body as T
}

// Solo para el log de desarrollo: nunca imprime la contraseña.
function maskSecrets(body: BodyInit | null | undefined): unknown {
  if (typeof body !== 'string') return body
  try {
    const parsed = JSON.parse(body)
    return 'password' in parsed ? { ...parsed, password: '***' } : parsed
  } catch {
    return body
  }
}
