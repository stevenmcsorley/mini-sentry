// Project adapter for transforming API data to domain models

import { Project } from '../../types/domain.types'
import { APIProject, CreateProjectRequest } from '../../types/api.types'

export class ProjectAdapter {
  /**
   * Transform API project data to domain model
   */
  static fromAPI(apiProject: APIProject): Project {
    return {
      id: apiProject.id,
      name: apiProject.name,
      slug: apiProject.slug,
      ingestToken: apiProject.ingest_token,
      createdAt: apiProject.created_at ? new Date(apiProject.created_at) : undefined
    }
  }

  /**
   * Transform multiple API projects to domain models
   */
  static fromAPIList(apiProjects: APIProject[]): Project[] {
    return apiProjects.map(this.fromAPI)
  }

  /**
   * Transform domain project data to API format for creation
   */
  static toCreateRequest(name: string): CreateProjectRequest {
    return { name }
  }

  /**
   * Transform domain project data to API format for updates
   */
  static toUpdateRequest(data: Partial<Project>): Partial<CreateProjectRequest> {
    const result: Partial<CreateProjectRequest> = {}
    
    if (data.name !== undefined) {
      result.name = data.name
    }
    
    return result
  }
}