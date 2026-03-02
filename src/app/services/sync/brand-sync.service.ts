import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth.service';

export interface Brand {
  brand_id: number;
  provider_id?: number;
  brand_name: string;
  brand_ident: string;
  brand_base_url: string;
  brand_ad_url: string;
  brand_logo?: string;
  active?: string;
  created?: string;
  last_synced?: string;
  [key: string]: any;
}

export interface BrandSyncResult {
  success: boolean;
  brands: Brand[];
  error?: string;
  inserted?: number;
  updated?: number;
  unchanged?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BrandSyncService {

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private auth: AuthService
  ) {}

  /**
   * Sync brands from platform API to management-api DB
   * @param instanceId - The instance ID to sync
   * @param apiEndpoint - The platform API endpoint
   * @param accessToken - The JWT access token for authentication
   */
  sync(instanceId: number, apiEndpoint: string, accessToken: string): Observable<BrandSyncResult> {
    const apiUrl = `${apiEndpoint}/admin/settings/brands`;
    const headers = { 'Authorization': accessToken };

    console.log('[BrandSync] Fetching from platform API:', apiUrl);

    return this.http.get<any[]>(apiUrl, { headers }).pipe(
      switchMap(brands => {
        console.log('[BrandSync] Fetched', brands.length, 'brands from platform API');
        
        // Transform to management-api format
        const transformedBrands = brands.map(brand => ({
          brand_id: parseInt(brand.brand_id, 10),
          brand_name: brand.brand_name,
          brand_base_url: brand.brand_base_url,
          brand_ad_url: brand.brand_ad_url,
          brand_ident: brand.brand_ident,
          active: brand.active || 'true'
        }));

        // Save to management-api
        const syncPayload = {
          instance_id: instanceId,
          brands: transformedBrands,
          user_id: this.auth.getUserId(),
          force_sync: false
        };

        console.log('[BrandSync] Saving to management-api...');

        return this.api.post('/clients/instance/brands/sync', syncPayload, false).pipe(
          map((response: any) => {
            console.log('[BrandSync] Saved to management-api:', response);
            
            // Load fresh data from cache
            return this.loadFromCache(instanceId);
          }),
          switchMap(result => result),
          catchError(error => {
            console.error('[BrandSync] Error saving to management-api:', error);
            return of({
              success: false,
              brands: [],
              error: error.message || 'Failed to save brands'
            });
          })
        );
      }),
      catchError(error => {
        console.error('[BrandSync] Error fetching from platform:', error);
        return of({
          success: false,
          brands: [],
          error: error.message || 'Failed to fetch brands'
        });
      })
    );
  }

  /**
   * Force sync brands - soft-deletes all existing active records then creates new entries
   * @param instanceId - The instance ID to sync
   * @param apiEndpoint - The platform API endpoint
   * @param accessToken - The JWT access token for authentication
   */
  forceSync(instanceId: number, apiEndpoint: string, accessToken: string): Observable<BrandSyncResult> {
    const apiUrl = `${apiEndpoint}/admin/settings/brands`;
    const headers = { 'Authorization': accessToken };

    console.log('[BrandSync] Force fetching from platform API (will soft-delete old and create new entries):', apiUrl);

    return this.http.get<any[]>(apiUrl, { headers }).pipe(
      switchMap(brands => {
        console.log('[BrandSync] Force sync - fetched', brands.length, 'brands from platform');
        
        // Transform to management-api format
        const transformedBrands = brands.map(brand => ({
          brand_id: parseInt(brand.brand_id, 10),
          brand_name: brand.brand_name,
          brand_base_url: brand.brand_base_url,
          brand_ad_url: brand.brand_ad_url,
          brand_ident: brand.brand_ident,
          active: brand.active || 'true'
        }));

        // Save to management-api with force flag
        const syncPayload = {
          instance_id: instanceId,
          brands: transformedBrands,
          user_id: this.auth.getUserId(),
          force_sync: true
        };

        console.log('[BrandSync] Force saving to management-api...');

        return this.api.post('/clients/instance/brands/sync', syncPayload, false).pipe(
          map((response: any) => {
            console.log('[BrandSync] Force saved to management-api:', response);
            
            // Load fresh data from cache
            return this.loadFromCache(instanceId);
          }),
          switchMap(result => result),
          catchError(error => {
            console.error('[BrandSync] Error force saving to management-api:', error);
            return of({
              success: false,
              brands: [],
              error: error.message || 'Failed to force save brands'
            });
          })
        );
      }),
      catchError(error => {
        console.error('[BrandSync] Error force fetching from platform:', error);
        return of({
          success: false,
          brands: [],
          error: error.message || 'Failed to force fetch brands'
        });
      })
    );
  }

  /**
   * Load brands from management-api cache
   */
  loadFromCache(instanceId: number): Observable<BrandSyncResult> {
    console.log('[BrandSync] Loading from management-api cache for instance', instanceId);
    
    return this.api.get(`/clients/instance/brands/${instanceId}`, false).pipe(
      map((brands: any[]) => {
        console.log('[BrandSync] Loaded', brands.length, 'brands from cache');
        
        // Transform from DB format back to display format
        const transformedBrands: Brand[] = brands.map(brand => ({
          brand_id: brand.brand_id,
          provider_id: brand.provider_id,
          brand_name: brand.brand_name,
          brand_ident: brand.brand_ident,
          brand_base_url: brand.brand_base_url,
          brand_ad_url: brand.brand_ad_url,
          brand_logo: brand.brand_logo,
          active: brand.active,
          created: brand.created,
          last_synced: brand.last_synced
        }));

        return {
          success: true,
          brands: transformedBrands
        };
      }),
      catchError(error => {
        console.error('[BrandSync] Error loading from cache:', error);
        return of({
          success: false,
          brands: [],
          error: error.message || 'Failed to load cached brands'
        });
      })
    );
  }
}
