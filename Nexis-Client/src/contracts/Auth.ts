export interface ApiToken {
  type: 'bearer'
  token: string
  expires_at?: string
  expires_in?: number
}

export interface RegisterData {
  firstName: string
  lastName: string
  userName: string
  email: string
  password: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface User {
  id: number
  firstName: string
  lastName: string
  userName: string
  email: string
  createdAt: string
  updatedAt: string
}
