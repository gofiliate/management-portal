import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from './api/api.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface ActionGuardRequest {
  section: string;
  endpoint: string;
}

export interface ActionGuardResponse {
  result: boolean;
  actions: { action_id: number; action_name: string }[];
  section: string;
  endpoint: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActionGuardService {
  private actionsSubject = new BehaviorSubject<{ action_id: number; action_name: string }[]>([]);
  public actions$ = this.actionsSubject.asObservable();
  
  // Cache for supplemental permissions (checking permissions for routes we're not currently on)
  private supplementalPermissionsCache = new Map<string, { action_id: number; action_name: string }[]>();
  
  // Cache for God mode status (synchronous check)
  private godModeStatus: boolean | null = null;
  
  // Track current route to prevent unnecessary refreshes
  private currentRoute = '';
  private isLoading = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    // Auto-refresh actions on navigation
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      const currentUrl = this.router.url;
      if (currentUrl !== this.currentRoute && !this.isLoading) {
        this.currentRoute = currentUrl;
        this.refreshActions();
        // Clear supplemental cache on navigation to ensure fresh permissions
        this.clearSupplementalCache();
      }
    });
    
    // Initial load
    this.refreshActions();
    
    // Cache god mode status on initialization
    this.cacheGodMode();
  }

  /**
   * Triggers a refresh of the permitted actions for the current route
   */
  refreshActions(): void {
    if (this.isLoading) {
      return; // Prevent multiple simultaneous requests
    }
    
    this.isLoading = true;
    const url = this.router.url;
    const segments = url.replace(/^\//, '').split('/').filter(s => s && !s.includes('?'));
    
    if (segments.length >= 2) {
      const section = segments[0];
      const endpoint = segments[1];
      const payload: ActionGuardRequest = { section, endpoint };
      
      this.apiService.post('gofiliate/navigation/action-guard', payload, null).subscribe({
        next: (res: ActionGuardResponse) => {
          if (res.result && res.actions) {
            this.actionsSubject.next(res.actions);
          } else {
            this.actionsSubject.next([]);
          }
          this.isLoading = false;
        },
        error: () => {
          this.actionsSubject.next([]);
          this.isLoading = false;
        }
      });
    } else {
      this.actionsSubject.next([]);
      this.isLoading = false;
    }
  }

  /**
   * Returns the current list of actions synchronously
   */
  getActionsList(): { action_id: number; action_name: string }[] {
    return this.actionsSubject.value;
  }

  /**
   * Cache god mode status for synchronous access
   * Called on initialization
   */
  private cacheGodMode(): void {
    this.godModeStatus = this.authService.isGod();
  }

  /**
   * Check if user has god mode privileges
   * Checks the JWT session for access_label === 'GOD'
   * Returns cached value for synchronous access in supplemental methods
   */
  isGod(): boolean {
    if (this.godModeStatus === null) {
      this.cacheGodMode();
    }
    return this.godModeStatus || false;
  }

  /**
   * Permission check helpers for use in components and templates
   */
  canView(): boolean {
    if (this.isGod()) return true;
    return this.actionsSubject.value.some(a => a.action_name === 'view' || a.action_name === 'super-user');
  }

  canCreate(): boolean {
    if (this.isGod()) return true;
    return this.actionsSubject.value.some(a => a.action_name === 'create' || a.action_name === 'super-user');
  }

  canEdit(): boolean {
    if (this.isGod()) return true;
    return this.actionsSubject.value.some(a => a.action_name === 'edit' || a.action_name === 'super-user');
  }

  canDelete(): boolean {
    if (this.isGod()) return true;
    return this.actionsSubject.value.some(a => a.action_name === 'delete' || a.action_name === 'super-user');
  }

  /**
   * Supplemental permission methods - check permissions for routes we're not currently on
   * These DON'T trigger refreshActions() and use their own cache
   */
  private loadSupplementalRoute(route: string): void {
    // If already cached or loading, don't load again
    if (this.supplementalPermissionsCache.has(route)) {
      return;
    }

    // Mark as loading with empty array
    this.supplementalPermissionsCache.set(route, []);

    const segments = route.split('/').filter(s => s);
    if (segments.length >= 2) {
      const section = segments[0];
      const endpoint = segments[1];
      const payload: ActionGuardRequest = { section, endpoint };
      
      // Direct API call without triggering refresh logic
      this.apiService.post('gofiliate/navigation/action-guard', payload, null).subscribe({
        next: (res: ActionGuardResponse) => {
          const actions = (res.result && res.actions) ? res.actions : [];
          this.supplementalPermissionsCache.set(route, actions);
        },
        error: () => {
          this.supplementalPermissionsCache.set(route, []);
        }
      });
    }
  }

  canViewSupplemental(route: string): boolean {
    if (this.isGod()) return true;
    
    this.loadSupplementalRoute(route);
    const actions = this.supplementalPermissionsCache.get(route) || [];
    return actions.some(a => a.action_name === 'view' || a.action_name === 'super-user');
  }

  canCreateSupplemental(route: string): boolean {
    if (this.isGod()) return true;
    
    this.loadSupplementalRoute(route);
    const actions = this.supplementalPermissionsCache.get(route) || [];
    return actions.some(a => a.action_name === 'create' || a.action_name === 'super-user');
  }

  canEditSupplemental(route: string): boolean {
    if (this.isGod()) return true;
    
    this.loadSupplementalRoute(route);
    const actions = this.supplementalPermissionsCache.get(route) || [];
    return actions.some(a => a.action_name === 'edit' || a.action_name === 'super-user');
  }

  canDeleteSupplemental(route: string): boolean {
    if (this.isGod()) return true;
    
    this.loadSupplementalRoute(route);
    const actions = this.supplementalPermissionsCache.get(route) || [];
    return actions.some(a => a.action_name === 'delete' || a.action_name === 'super-user');
  }

  hasSupplementalAccess(route: string): boolean {
    if (this.isGod()) return true;
    
    this.loadSupplementalRoute(route);
    const actions = this.supplementalPermissionsCache.get(route) || [];
    return actions.length > 0;
  }

  /**
   * Clear supplemental cache (useful for logout or permission changes)
   */
  clearSupplementalCache(): void {
    this.supplementalPermissionsCache.clear();
  }

  /**
   * Clear all caches and reset state (call on logout)
   */
  clearAll(): void {
    this.actionsSubject.next([]);
    this.clearSupplementalCache();
    this.currentRoute = '';
    this.godModeStatus = null;
  }
  
  /**
   * Refresh god mode cache (call after login or role change)
   */
  refreshGodMode(): void {
    this.cacheGodMode();
  }
}
