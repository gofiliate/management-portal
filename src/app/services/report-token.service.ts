import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface ReportTokenDetails {
  instance_id: number;
  manager_id: number;
  token: string;
}

export interface ReportTokenFailure {
  instance_id: number;
  manager_id: number;
  error: string;
}

export interface ReportTokensResponse {
  error: boolean;
  tokens: { [key: string]: ReportTokenDetails }; // key is "instance_id:manager_id"
  failed?: ReportTokenFailure[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportTokenService {
  
  private managementApi = environment.api; // Management API base URL
  private tokens: Map<number, ReportTokenDetails> = new Map(); // Cache tokens by instance_id
  private isLoading: boolean = false;
  private hasLoaded: boolean = false;

  constructor(private http: HttpClient) {}

  /**
   * Fetch report tokens from management API
   * Tokens are cached in memory for the session
   */
  fetchTokens(): Observable<ReportTokensResponse> {
    this.isLoading = true;

    // Get bearer token from localStorage
    const bearerToken = this.getBearerToken();
    
    if (!bearerToken) {
      this.isLoading = false;
      return throwError(() => new Error('No authentication token found'));
    }

    // Set up headers with JWT
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': bearerToken
    });

    const url = `${this.managementApi}/gofiliate/report-tokens`;

    return this.http.get<ReportTokensResponse>(url, { headers }).pipe(
      tap(response => {
        if (!response.error && response.tokens) {
          // Cache tokens by instance_id for easy lookup
          Object.values(response.tokens).forEach(tokenDetail => {
            this.tokens.set(tokenDetail.instance_id, tokenDetail);
          });
          
          console.log(`[ReportTokenService] Fetched ${Object.keys(response.tokens).length} report tokens`);
          
          if (response.failed && response.failed.length > 0) {
            console.warn(`[ReportTokenService] Failed to generate tokens for ${response.failed.length} instances:`, response.failed);
          }
          
          this.hasLoaded = true;
        }
        this.isLoading = false;
      }),
      catchError(error => {
        console.error('[ReportTokenService] Error fetching report tokens:', error);
        this.isLoading = false;
        return throwError(() => error);
      })
    );
  }

  /**
   * Get token for a specific instance
   * Returns null if no token is available for the instance
   */
  getTokenForInstance(instanceId: number): string | null {
    const tokenDetail = this.tokens.get(instanceId);
    return tokenDetail ? tokenDetail.token : null;
  }

  /**
   * Check if tokens have been loaded
   */
  tokensLoaded(): boolean {
    return this.hasLoaded;
  }

  /**
   * Check if currently loading tokens
   */
  tokensLoading(): boolean {
    return this.isLoading;
  }

  /**
   * Get all cached tokens
   */
  getAllTokens(): Map<number, ReportTokenDetails> {
    return this.tokens;
  }

  /**
   * Clear cached tokens (e.g., on logout)
   */
  clearTokens(): void {
    this.tokens.clear();
    this.hasLoaded = false;
  }

  /**
   * Get Bearer token from localStorage
   */
  private getBearerToken(): string | null {
    const user = localStorage.getItem('GofiliateUser');
    if (user) {
      const userObject = JSON.parse(user);
      return userObject.bearer || null;
    }
    return null;
  }
}
