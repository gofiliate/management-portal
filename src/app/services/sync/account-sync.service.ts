import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth.service';

export interface Manager {
  user_id: number;
  username: string;
  user_role: string;
  role_id: number;
  email: string;
  description: string;
  full_name: string;
  status: string;
  access_type_id: number;
  player_access: boolean;
  support_access?: boolean;
}

export interface AccountSyncResult {
  success: boolean;
  managers: Manager[];
  error?: string;
  inserted?: number;
  updated?: number;
  unchanged?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AccountSyncService {

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private auth: AuthService
  ) {}

  /**
   * Sync account managers from platform API to management-api DB
   * @param instanceId - The instance ID to sync
   * @param apiEndpoint - The platform API endpoint
   * @param accessToken - The JWT access token for authentication
   */
  sync(instanceId: number, apiEndpoint: string, accessToken: string): Observable<AccountSyncResult> {
    const apiUrl = `${apiEndpoint}/admin/settings/permissions/affiliate-managers`;
    const headers = { 'Authorization': accessToken };

    console.log('[AccountSync] Fetching from platform API:', apiUrl);

    return this.http.get<Manager[]>(apiUrl, { headers }).pipe(
      switchMap(managers => {
        console.log('[AccountSync] Fetched', managers.length, 'managers from platform');
        
        // Transform to DB format and save
        return this.saveToDatabase(instanceId, managers, false);
      }),
      catchError(error => {
        console.error('[AccountSync] Error fetching from platform:', error);
        return of({
          success: false,
          managers: [],
          error: error.message || 'Failed to fetch account managers'
        });
      })
    );
  }

  /**
   * Force sync account managers - always creates new entries in DB
   * @param instanceId - The instance ID to sync
   * @param apiEndpoint - The platform API endpoint
   * @param accessToken - The JWT access token for authentication
   */
  forceSync(instanceId: number, apiEndpoint: string, accessToken: string): Observable<AccountSyncResult> {
    const apiUrl = `${apiEndpoint}/admin/settings/permissions/affiliate-managers`;
    const headers = { 'Authorization': accessToken };

    console.log('[AccountSync] Force fetching from platform API (will create new entries):', apiUrl);

    return this.http.get<Manager[]>(apiUrl, { headers }).pipe(
      switchMap(managers => {
        console.log('[AccountSync] Fetched', managers.length, 'managers from platform for force sync');
        
        // Transform to DB format and save with force flag
        return this.saveToDatabase(instanceId, managers, true);
      }),
      catchError(error => {
        console.error('[AccountSync] Error force fetching from platform:', error);
        return of({
          success: false,
          managers: [],
          error: error.message || 'Failed to force fetch account managers'
        });
      })
    );
  }

  /**
   * Save account managers to management-api database
   * @param force - If true, always create new entries instead of soft delete/update
   */
  private saveToDatabase(instanceId: number, managers: Manager[], force: boolean = false): Observable<AccountSyncResult> {
    const syncPayload = {
      instance_id: instanceId,
      user_id: this.auth.getUserId(),
      force_sync: force,
      accounts: managers.map(m => ({
        instance_id: instanceId,
        user_id: m.user_id,
        account_username: m.username,
        account_email: m.email,
        account_role_id: m.role_id,
        account_role_label: m.user_role,
        account_status: m.status,
        creator_id: this.auth.getUserId()
      }))
    };

    return this.api.post('/clients/instance/user-accounts/sync', syncPayload, false).pipe(
      map((response: any) => {
        console.log('[AccountSync] Saved to management-api:', response);
        console.log('[AccountSync] Sync stats - Inserted:', response?.inserted, 'Updated:', response?.updated, 'Unchanged:', response?.unchanged);
        
        // Load fresh data from cache to get only active records
        return this.loadFromCache(instanceId);
      }),
      switchMap(result => result),
      catchError(error => {
        console.error('[AccountSync] Error saving to management-api:', error);
        return of({
          success: false,
          managers: [],
          error: error.message || 'Failed to save account managers'
        });
      })
    );
  }

  /**
   * Load account managers from management-api cache
   */
  loadFromCache(instanceId: number): Observable<AccountSyncResult> {
    console.log('[AccountSync] Loading from management-api cache...');
    
    return this.api.get(`/clients/instance/user-accounts/${instanceId}`, false).pipe(
      map((accounts: any[]) => {
        if (!accounts || accounts.length === 0) {
          return {
            success: true,
            managers: []
          };
        }

        // Convert DB format to Manager format
        const managers = accounts.map(acc => ({
          user_id: acc.user_id,
          username: acc.account_username,
          user_role: acc.account_role_label,
          role_id: acc.account_role_id,
          email: acc.account_email,
          description: '',
          full_name: '',
          status: acc.account_status,
          access_type_id: 0,
          player_access: false
        }));

        return {
          success: true,
          managers: managers
        };
      }),
      catchError(error => {
        console.error('[AccountSync] Error loading from cache:', error);
        return of({
          success: false,
          managers: [],
          error: error.message || 'Failed to load from cache'
        });
      })
    );
  }
}
