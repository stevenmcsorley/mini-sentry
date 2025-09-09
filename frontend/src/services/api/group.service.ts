// Group (Issue) API service

import { BaseAPIService } from './base.service'
import { 
  APIGroup, 
  APIResponse, 
  UpdateGroupRequest 
} from '../../types/api.types'

export class GroupService extends BaseAPIService {
  private static readonly BASE_URL = '/api/groups'

  static async getAll(params?: {
    project?: string
    level?: string
    environment?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<APIGroup[]> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const url = searchParams.toString() 
      ? `${this.BASE_URL}/?${searchParams.toString()}`
      : `${this.BASE_URL}/`

    const response = await this.get<APIGroup[] | APIResponse<APIGroup>>(url)
    
    // Handle both array and paginated responses
    if (Array.isArray(response)) {
      return response
    }
    
    return response.results
  }

  static async getById(id: number): Promise<APIGroup> {
    return this.get<APIGroup>(`${this.BASE_URL}/${id}/`)
  }

  static async update(id: number, data: UpdateGroupRequest): Promise<APIGroup> {
    return this.patch<APIGroup>(`${this.BASE_URL}/${id}/`, data)
  }

  static async resolve(id: number, comment?: string): Promise<APIGroup> {
    return this.update(id, { status: 'resolved', comment })
  }

  static async unresolve(id: number, comment?: string): Promise<APIGroup> {
    return this.update(id, { status: 'unresolved', comment })
  }

  static async ignore(id: number, comment?: string): Promise<APIGroup> {
    return this.update(id, { status: 'ignored', comment })
  }

  static async assign(id: number, assignee: string, comment?: string): Promise<APIGroup> {
    return this.update(id, { assignee, comment })
  }

  static async addComment(id: number, comment: string): Promise<void> {
    await this.post(`${this.BASE_URL}/${id}/comments/`, { comment })
  }

  static async delete(id: number): Promise<void> {
    await this.delete<void>(`${this.BASE_URL}/${id}/`)
  }
}