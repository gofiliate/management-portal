import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';

export interface NavigationItem {
  section_id: number;
  section_name: string;
  section_icon: string;
  endpoint_id: number;
  endpoint_name: string;
  path: string;
  endpoint_order: number;
  in_navigation: boolean;
}

export interface NavigationResponse {
  result: boolean;
  navigation: NavigationItem[];
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  constructor(private api: ApiService) { }

  /**
   * Fetches navigation items from the API based on the authenticated user's ACL permissions
   * @returns Observable<NavigationResponse> - Navigation data from the backend
   */
  getNavigation(): Observable<NavigationResponse> {
    return this.api.get('/navigation', false);
  }
}
