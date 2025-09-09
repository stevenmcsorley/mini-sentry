// Project API service

import { BaseAPIService } from './base.service'
import { 
  APIProject, 
  APIResponse, 
  CreateProjectRequest 
} from '../../types/api.types'

export class ProjectService extends BaseAPIService {
  private static readonly BASE_URL = '/api/projects'

  static async getAll(): Promise<APIProject[]> {
    const response = await this.get<APIProject[] | APIResponse<APIProject>>(this.BASE_URL)
    
    // Handle both array and paginated responses
    if (Array.isArray(response)) {
      return response
    }
    
    return response.results
  }

  static async getById(id: number): Promise<APIProject> {
    return this.get<APIProject>(`${this.BASE_URL}/${id}/`)
  }

  static async create(data: CreateProjectRequest): Promise<APIProject> {
    return this.post<APIProject>(`${this.BASE_URL}/`, data)
  }

  static async update(id: number, data: Partial<CreateProjectRequest>): Promise<APIProject> {
    return this.patch<APIProject>(`${this.BASE_URL}/${id}/`, data)
  }

  static async delete(id: number): Promise<void> {
    await this.delete<void>(`${this.BASE_URL}/${id}/`)
  }

  static async getStats(projectSlug: string): Promise<{
    releases: number
    artifacts: number
    groups: number
    events: number
  }> {
    return this.get(`/api/stats/?project=${projectSlug}`)
  }
}