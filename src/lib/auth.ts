import axios from 'axios'

const authApi = axios.create({
  baseURL: '/auth',
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    username: string
    email: string
    roles: string[]
  }
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    // Backend uses Basic Authentication
    const response = await authApi.post('/authenticate', {}, {
      auth: {
        username: credentials.username,
        password: credentials.password,
      },
    })
    // Backend returns object with token and expiresIn
    return {
      token: response.data.token,
      user: {
        id: '',
        username: credentials.username,
        email: '',
        roles: [],
      },
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log('Attempting registration with:', { name: data.name, email: data.email })
      const response = await authApi.post('/register', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      console.log('Registration response:', response.data)
      // Backend returns user data (id, name, email, enabled, createdAt)
      // No token is returned, user needs to check email and set password
      return {
        token: '', // No token yet
        user: {
          id: response.data.id,
          username: response.data.name,
          email: response.data.email,
          roles: [],
        },
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      throw error
    }
  },

  async changePassword(password: string, hash: string): Promise<void> {
    await authApi.put(
      '/change-password',
      { password, hash },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  },

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token')
  },

  getUser() {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },
}
