import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth.service';

export interface Affiliate {
  user_id: number;
  username: string;
  join_date: string;
  country: string;
  status: string;
  admin_id?: number;
  admin_username?: string;
  email?: string;
  company?: string;
  affiliate_unsecure_token?: string;
}

export interface AffiliateSyncResult {
  success: boolean;
  affiliates: Affiliate[];
  error?: string;
  inserted?: number;
  updated?: number;
  unchanged?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AffiliateSyncService {

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private auth: AuthService
  ) {}

  /**
   * Sync affiliates from platform API to management-api DB
   * @param instanceId - The instance ID to sync
   * @param apiEndpoint - The platform API endpoint
   * @param accessToken - The JWT access token for authentication
   */
  sync(instanceId: number, apiEndpoint: string, accessToken: string): Observable<AffiliateSyncResult> {
    const apiUrl = `${apiEndpoint}/admin/account/affiliate-status`;
    const headers = { 'Authorization': accessToken };

    return this.http.get<any[]>(apiUrl, { headers }).pipe(
      switchMap(affiliates => {
        // Transform to management-api format - parse strings to integers
        const transformedAffiliates = affiliates.map(aff => ({
          user_id: parseInt(aff.user_id, 10),
          manager_id: parseInt(aff.admin_id, 10) || 0,
          affiliate_username: aff.username,
          affiliate_unsecure_token: aff.unsecure_token || aff.affiliate_unsecure_token || null,
          affiliate_status: aff.status
        }));

        // Save to management-api
        const syncPayload = {
          instance_id: instanceId,
          accounts: transformedAffiliates,
          user_id: this.auth.getUserId(),
          force_sync: false
        };

        return this.api.post('/clients/instance/affiliate-accounts/sync', syncPayload, false).pipe(
          map((response: any) => {
            // Load fresh data from cache
            return this.loadFromCache(instanceId);
          }),
          switchMap(result => result),
          catchError(error => {
            return of({
              success: false,
              affiliates: [],
              error: error.message || 'Failed to save affiliates'
            });
          })
        );
      }),
      catchError(error => {
        return of({
          success: false,
          affiliates: [],
          error: error.message || 'Failed to fetch affiliates'
        });
      })
    );
  }

  /**
   * Force sync affiliates - soft-deletes all existing active records then creates new entries
   * @param instanceId - The instance ID to sync
   * @param apiEndpoint - The platform API endpoint
   * @param accessToken - The JWT access token for authentication
   */
  forceSync(instanceId: number, apiEndpoint: string, accessToken: string): Observable<AffiliateSyncResult> {
    const apiUrl = `${apiEndpoint}/admin/account/affiliate-status`;
    const headers = { 'Authorization': accessToken };

    return this.http.get<any[]>(apiUrl, { headers }).pipe(
      switchMap(affiliates => {
        // Transform to management-api format - parse strings to integers
        const transformedAffiliates = affiliates.map(aff => ({
          user_id: parseInt(aff.user_id, 10),
          manager_id: parseInt(aff.admin_id, 10) || 0,
          affiliate_username: aff.username,
          affiliate_unsecure_token: aff.unsecure_token || aff.affiliate_unsecure_token || null,
          affiliate_status: aff.status
        }));

        // Save to management-api with force flag
        const syncPayload = {
          instance_id: instanceId,
          accounts: transformedAffiliates,
          user_id: this.auth.getUserId(),
          force_sync: true
        };

        return this.api.post('/clients/instance/affiliate-accounts/sync', syncPayload, false).pipe(
          map((response: any) => {
            // Load fresh data from cache
            return this.loadFromCache(instanceId);
          }),
          switchMap(result => result),
          catchError(error => {
            return of({
              success: false,
              affiliates: [],
              error: error.message || 'Failed to force save affiliates'
            });
          })
        );
      }),
      catchError(error => {
        return of({
          success: false,
          affiliates: [],
          error: error.message || 'Failed to force fetch affiliates'
        });
      })
    );
  }

  /**
   * Load affiliates from management-api cache
   */
  loadFromCache(instanceId: number): Observable<AffiliateSyncResult> {
    return this.api.get(`/clients/instance/affiliate-accounts/${instanceId}`, false).pipe(
      map((affiliates: any[]) => {
        // Transform from DB format back to display format
        const transformedAffiliates: Affiliate[] = affiliates.map(aff => ({
          user_id: aff.user_id,
          username: aff.affiliate_username,
          status: aff.affiliate_status,
          manager_id: aff.manager_id,
          admin_id: aff.manager_id,
          join_date: aff.created || '',
          last_synced: aff.last_synced,
          affiliate_unsecure_token: aff.affiliate_unsecure_token,
          country: '',
          admin_username: '',
          email: '',
          company: ''
        }));

        return {
          success: true,
          affiliates: transformedAffiliates
        };
      }),
      catchError(error => {
        return of({
          success: false,
          affiliates: [],
          error: error.message || 'Failed to load cached affiliates'
        });
      })
    );
  }
}

