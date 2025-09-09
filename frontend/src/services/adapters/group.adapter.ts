// Group adapter for transforming API data to domain models

import { Group } from '../../types/domain.types'
import { APIGroup, UpdateGroupRequest } from '../../types/api.types'

export class GroupAdapter {
  /**
   * Transform API group data to domain model
   */
  static fromAPI(apiGroup: APIGroup): Group {
    return {
      id: apiGroup.id,
      title: apiGroup.title,
      level: apiGroup.level,
      count: apiGroup.count,
      lastSeen: apiGroup.last_seen,
      status: this.mapStatus(apiGroup.status),
      assignee: apiGroup.assignee
    }
  }

  /**
   * Transform multiple API groups to domain models
   */
  static fromAPIList(apiGroups: APIGroup[]): Group[] {
    return apiGroups.map(this.fromAPI)
  }

  /**
   * Transform domain group update to API format
   */
  static toUpdateRequest(
    status?: 'resolved' | 'unresolved' | 'ignored',
    assignee?: string,
    comment?: string
  ): UpdateGroupRequest {
    const result: UpdateGroupRequest = {}
    
    if (status !== undefined) {
      result.status = status
    }
    
    if (assignee !== undefined) {
      result.assignee = assignee
    }
    
    if (comment !== undefined) {
      result.comment = comment
    }
    
    return result
  }

  /**
   * Map API status to domain status
   */
  private static mapStatus(apiStatus?: string): 'resolved' | 'unresolved' | 'ignored' | undefined {
    if (!apiStatus) return undefined
    
    switch (apiStatus.toLowerCase()) {
      case 'resolved':
        return 'resolved'
      case 'unresolved':
        return 'unresolved'
      case 'ignored':
        return 'ignored'
      default:
        return 'unresolved'
    }
  }
}