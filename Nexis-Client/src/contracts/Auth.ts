export interface ApiToken {
  type: 'bearer'
  token: string
  expires_at?: string
  expires_in?: number
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  userName: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface User {
  id: number
  email: string
  createdAt: string,
  updatedAt: string
}
