import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AccountSyncService, AccountSyncResult } from './account-sync.service';
import { AffiliateSyncService, AffiliateSyncResult } from './affiliate-sync.service';
import { BrandSyncService, BrandSyncResult } from './brand-sync.service';
import { CommissionSyncService, CommissionSyncResult } from './commission-sync.service';

export interface SyncProgress {
  entity: 'accounts' | 'affiliates' | 'brands' | 'commissions';
  status: 'pending' | 'syncing' | 'complete' | 'error';
  progress?: number;
  message?: string;
  result?: any;
}

export interface SyncAllResult {
  success: boolean;
  results: {
    accounts?: AccountSyncResult;
    affiliates?: AffiliateSyncResult;
    brands?: BrandSyncResult;
    commissions?: CommissionSyncResult;
  };
  errors: string[];
  totalSynced: number;
}

@Injectable({
  providedIn: 'root'
})
export class InterfaceSyncService {

  private syncProgress: Map<string, SyncProgress> = new Map();

  constructor(
    private accountSync: AccountSyncService,
    private affiliateSync: AffiliateSyncService,
    private brandSync: BrandSyncService,
    private commissionSync: CommissionSyncService
  ) {}

  /**
   * Sync all entities from platform API to management-api
   */
  syncAll(instanceId: number, apiEndpoint: string, accessToken: string): Observable<SyncAllResult> {
    console.log('[InterfaceSync] Starting sync all for instance', instanceId);

    // Initialize progress tracking
    this.initializeProgress();

    // Execute syncs in parallel
    return forkJoin({
      accounts: this.syncAccounts(instanceId, apiEndpoint, accessToken),
      affiliates: this.syncAffiliates(instanceId, apiEndpoint, accessToken),
      // brands: this.syncBrands(instanceId, apiEndpoint, accessToken),
      // commissions: this.syncCommissions(instanceId, apiEndpoint, accessToken)
    }).pipe(
      map(results => {
        const errors: string[] = [];
        let totalSynced = 0;

        // Check for errors
        if (!results.accounts.success) {
          errors.push(`Accounts: ${results.accounts.error}`);
        } else {
          totalSynced += results.accounts.managers.length;
        }

        if (!results.affiliates.success) {
          errors.push(`Affiliates: ${results.affiliates.error}`);
        } else {
          totalSynced += results.affiliates.affiliates.length;
        }

        // TODO: Add other entity checks when implemented

        return {
          success: errors.length === 0,
          results,
          errors,
          totalSynced
        };
      }),
      catchError(error => {
        console.error('[InterfaceSync] Sync all failed:', error);
        return of({
          success: false,
          results: {},
          errors: [error.message || 'Sync failed'],
          totalSynced: 0
        });
      })
    );
  }

  /**
   * Sync account managers only
   */
  syncAccounts(instanceId: number, apiEndpoint: string, accessToken: string): Observable<AccountSyncResult> {
    this.updateProgress('accounts', 'syncing', 'Syncing account managers...');
    
    return this.accountSync.sync(instanceId, apiEndpoint, accessToken).pipe(
      map(result => {
        this.updateProgress('accounts', 'complete', 'Account managers synced', result);
        return result;
      }),
      catchError(error => {
        this.updateProgress('accounts', 'error', error.message || 'Sync failed');
        return of({ success: false, managers: [], error: error.message });
      })
    );
  }

  /**
   * Sync affiliates only
   */
  syncAffiliates(instanceId: number, apiEndpoint: string, accessToken: string): Observable<AffiliateSyncResult> {
    this.updateProgress('affiliates', 'syncing', 'Syncing affiliates...');
    
    return this.affiliateSync.sync(instanceId, apiEndpoint, accessToken).pipe(
      map(result => {
        this.updateProgress('affiliates', 'complete', 'Affiliates synced', result);
        return result;
      }),
      catchError(error => {
        this.updateProgress('affiliates', 'error', error.message || 'Sync failed');
        return of({ success: false, affiliates: [], error: error.message });
      })
    );
  }

  /**
   * Sync brands only
   */
  syncBrands(instanceId: number, apiEndpoint: string, accessToken: string): Observable<BrandSyncResult> {
    this.updateProgress('brands', 'syncing', 'Syncing brands...');
    
    return this.brandSync.sync(instanceId, apiEndpoint, accessToken).pipe(
      map(result => {
        this.updateProgress('brands', 'complete', 'Brands synced', result);
        return result;
      }),
      catchError(error => {
        this.updateProgress('brands', 'error', error.message || 'Sync failed');
        return of({ success: false, brands: [], error: error.message });
      })
    );
  }

  /**
   * Sync commission plans only
   */
  syncCommissions(instanceId: number, apiEndpoint: string, accessToken: string): Observable<CommissionSyncResult> {
    this.updateProgress('commissions', 'syncing', 'Syncing commission plans...');
    
    return this.commissionSync.sync(instanceId, apiEndpoint, accessToken).pipe(
      map(result => {
        this.updateProgress('commissions', 'complete', 'Commission plans synced', result);
        return result;
      }),
      catchError(error => {
        this.updateProgress('commissions', 'error', error.message || 'Sync failed');
        return of({ success: false, commissions: [], error: error.message });
      })
    );
  }

  /**
   * Get sync progress for a specific entity
   */
  getProgress(entity: string): SyncProgress | undefined {
    return this.syncProgress.get(entity);
  }

  /**
   * Get all sync progress
   */
  getAllProgress(): SyncProgress[] {
    return Array.from(this.syncProgress.values());
  }

  /**
   * Initialize progress tracking
   */
  private initializeProgress(): void {
    const entities: Array<'accounts' | 'affiliates' | 'brands' | 'commissions'> = 
      ['accounts', 'affiliates', 'brands', 'commissions'];
    
    entities.forEach(entity => {
      this.syncProgress.set(entity, {
        entity,
        status: 'pending',
        progress: 0
      });
    });
  }

  /**
   * Update progress for an entity
   */
  private updateProgress(
    entity: 'accounts' | 'affiliates' | 'brands' | 'commissions', 
    status: 'pending' | 'syncing' | 'complete' | 'error',
    message?: string,
    result?: any
  ): void {
    this.syncProgress.set(entity, {
      entity,
      status,
      progress: status === 'complete' ? 100 : status === 'syncing' ? 50 : 0,
      message,
      result
    });
  }
}
