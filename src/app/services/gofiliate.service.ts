import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api/api.service';

export interface NavigationSection {
  section_id: number;
  section_name: string;
  section_description: string;
  section_slug: string;
  section_icon: string;
  creator_id: string;
  created: string;
  updater_id?: string;
  updated?: string;
  order: number;
  status: number;
}

export interface NavigationEndpoint {
  endpoint_id: number;
  section_id: number;
  endpoint_name: string;
  endpoint_description: string;
  endpoint_slug: string;
  interface_component?: string;
  order: number;
  in_navigation: boolean;
  twofa_required: boolean;
  creator_id: string;
  created: string;
  updater_id?: string;
  updated?: string;
  status: number;
}

export interface SaveSectionRequest {
  section_id?: number;
  section_name: string;
  section_description: string;
  section_slug: string;
  section_icon: string;
  order: number;
  status: number;
  deactivate?: boolean;
}

export interface SaveEndpointRequest {
  endpoint_id?: number;
  section_id: number;
  endpoint_name: string;
  endpoint_description: string;
  endpoint_slug: string;
  interface_component?: string;
  order: number;
  in_navigation: boolean;
  twofa_required: boolean;
  status: number;
  deactivate?: boolean;
}

export interface User {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture: string;
  totp_enabled: boolean;
  totp_verified_at?: string;
  can_login: number;
  has_managers: number;
  is_internal: boolean;
  is_guest: boolean;
  is_god: boolean;
  created: string;
  updated: string;
  status: number;
  role_id?: number;
  role_name?: string;
}

export interface Role {
  role_id: number;
  role_name: string;
  role_description: string;
  protected: number;
  status: number;
}

export interface SaveUserRequest {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture: string;
  role_id: number;
  has_managers: number;
  can_login: number;
  is_internal: number;
  is_guest: number;
  is_god: number;
  status: number;
}

export interface Client {
  client_id: number;
  client_name: string;
  client_logo: string | null;
  created: string;
  updated: string;
  status: number;
}

export interface ClientInstance {
  instance_id: number;
  instance_name: string;
  client_logo: string | null;
  api_endpoint: string;
  status: number;
}

export interface Manager {
  manager_id: number;
  username: string;
  email: string;
  account_role_id: number;
  affiliate_count: number;
}

export interface UserAccess {
  client_ids: number[];
  instance_ids: number[];
  managers: { instance_id: number; manager_id: number }[];
}

export interface EmailTemplate {
  email_id: number;
  email_name: string;
  email_description: string;
  email_trigger: string;
  email_from: string;
  email_title: string;
  email_text: string;
  email_type: 'internal-template' | 'external-template' | null;
  email_status: number;
}

export interface SaveEmailTemplateRequest {
  email_id?: number;
  email_name: string;
  email_description: string;
  email_trigger: string;
  email_from: string;
  email_title: string;
  email_text: string;
  email_type: 'internal-template' | 'external-template' | null;
  email_status?: number;
  deactivate?: boolean;
}

export interface UserInvitation {
  invitation_id: number;
  email: string;
  given_name: string;
  role_id: number;
  role_name?: string;
  token: string;
  expires_at: string;
  accepted: number;
  creator_id: number;
  created: string;
  updater_id?: number;
  updated?: string;
}

export interface SendInvitationRequest {
  email: string;
  given_name: string;
  role_id: number;
}

export interface AcceptInvitationRequest {
  token: string;
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class GofiliateService {

  constructor(private apiService: ApiService) {}

  // Navigation Sections API
  getSections(): Observable<{ result: boolean; sections: NavigationSection[]; count: number }> {
    return this.apiService.get('gofiliate/navigation-sections', false);
  }

  saveSection(data: SaveSectionRequest): Observable<any> {
    return this.apiService.post('gofiliate/navigation-sections', data, false);
  }

  deactivateSection(sectionId: number): Observable<any> {
    return this.apiService.post('gofiliate/navigation-sections', { section_id: sectionId, deactivate: true }, false);
  }

  updateSectionOrder(updates: { section_id: number; order: number }[]): Observable<any> {
    return this.apiService.post('gofiliate/navigation-sections/reorder', { updates }, false);
  }

  // Navigation Endpoints API
  getEndpoints(): Observable<{ result: boolean; endpoints: NavigationEndpoint[]; count: number }> {
    return this.apiService.get('gofiliate/navigation-endpoints', false);
  }

  saveEndpoint(data: SaveEndpointRequest): Observable<any> {
    return this.apiService.post('gofiliate/navigation-endpoints', data, false);
  }

  deactivateEndpoint(endpointId: number): Observable<any> {
    return this.apiService.post('gofiliate/navigation-endpoints', { endpoint_id: endpointId, deactivate: true }, false);
  }

  updateEndpointOrder(updates: { endpoint_id: number; order: number }[]): Observable<any> {
    return this.apiService.post('gofiliate/navigation-endpoints/reorder', { updates }, false);
  }

  // Users API
  getUsers(): Observable<{ result: boolean; users: User[]; count: number }> {
    return this.apiService.get('gofiliate/users', false);
  }

  saveUser(data: SaveUserRequest): Observable<any> {
    return this.apiService.post('gofiliate/users', data, false);
  }

  // Roles API
  getRoles(): Observable<{ result: boolean; roles: Role[]; count: number }> {
    return this.apiService.get('gofiliate/roles', false);
  }

  // Clients API
  getClients(): Observable<any> {
    return this.apiService.get('clients', false);
  }

  getClientInstances(clientId: number): Observable<any> {
    return this.apiService.get(`clients/instances/${clientId}`, false);
  }

  getInstanceManagers(instanceId: number): Observable<any> {
    return this.apiService.get(`clients/instance/managers/${instanceId}`, false);
  }

  // User Access API
  getUserAccess(userId: number): Observable<UserAccess> {
    return this.apiService.get(`gofiliate/users/${userId}/access`, false);
  }

  saveUserAccess(data: { user_id: number; client_ids: number[]; instance_ids: number[]; managers: { instance_id: number; manager_id: number }[]; creator_id: number }): Observable<any> {
    return this.apiService.post('gofiliate/users/access', data, false);
  }

  // Pool Access API (with full details)
  getPoolAccess(userId: number): Observable<any> {
    return this.apiService.get(`gofiliate/users/${userId}/pool-access`, false);
  }

  savePoolAccess(userId: number, data: { client_ids: number[]; instance_ids: number[]; manager_access: { instance_id: number; manager_id: number }[]; creator_id: number }): Observable<any> {
    return this.apiService.post(`gofiliate/users/${userId}/pool-access`, data, false);
  }

  // Email Templates API
  getEmailTemplates(): Observable<{ result: boolean; emails: EmailTemplate[]; count: number }> {
    return this.apiService.get('gofiliate/emails', false);
  }

  getEmailTemplate(emailId: number): Observable<{ result: boolean; email: EmailTemplate }> {
    return this.apiService.get(`gofiliate/emails/${emailId}`, false);
  }

  saveEmailTemplate(data: SaveEmailTemplateRequest): Observable<any> {
    return this.apiService.post('gofiliate/emails', data, false);
  }

  deactivateEmailTemplate(emailId: number): Observable<any> {
    return this.apiService.post('gofiliate/emails', { email_id: emailId, deactivate: true }, false);
  }

  // User Invitations API
  getUserInvitations(): Observable<{ result: boolean; invitations: UserInvitation[]; count: number }> {
    return this.apiService.get('gofiliate/invitations', false);
  }

  sendUserInvitation(data: SendInvitationRequest): Observable<any> {
    return this.apiService.post('gofiliate/invitations', data, false);
  }

  validateInvitation(token: string): Observable<any> {
    return this.apiService.getNoAuth(`gofiliate/invitations/${token}`);
  }

  acceptInvitation(data: AcceptInvitationRequest): Observable<any> {
    return this.apiService.postNoAuth('gofiliate/invitations/accept', data);
  }
}