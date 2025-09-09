// Base API service with common functionality

import { APIError } from '../../types/api.types'

export class APIServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'APIServiceError'
  }
}

export class BaseAPIService {
  protected static async request<T>(
    path: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = path.startsWith('http') ? path : `${path}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData: APIError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`
        }))
        
        throw new APIServiceError(
          errorData.error || 'API request failed',
          response.status,
          errorData.details
        )
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T
      }

      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof APIServiceError) {
        throw error
      }
      
      // Network or other errors
      throw new APIServiceError(
        error instanceof Error ? error.message : 'Network error occurred'
      )
    }
  }

  protected static async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' })
  }

  protected static async post<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  protected static async put<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  protected static async patch<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  protected static async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' })
  }
}