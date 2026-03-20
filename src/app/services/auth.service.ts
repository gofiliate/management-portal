import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { JWTUser, TOTPRequiredResponse } from '../models/jwt-user.model';
import { 
  TOTPSetupResponse, 
  TOTPVerifySetupRequest, 
  TOTPVerifyLoginRequest, 
  TOTPDisableRequest,
  BackupCodeRequest 
} from '../models/totp.model';
import { environment } from '../../environments/environment';
import { Observable, from } from 'rxjs';
import { ApiService } from './api/api.service';

declare const google: any;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionKey = 'GofiliateUser';
  private isBrowser: boolean;
  private googleInitialized = false;

  constructor(
    private http: HttpClient,
    private apiService: ApiService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.loadGoogleScript();
    }
  }

  private loadGoogleScript() {
    if (document.getElementById('google-oauth-script')) {
      this.googleInitialized = true;
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-oauth-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.googleInitialized = true;
    };
    document.head.appendChild(script);
  }

  login(credentials: { username: string; password: string }) {
    const endpoint = `${environment.api}/account/login`;
    return this.http.post<JWTUser>(endpoint, credentials);
  }

  register(userData: { username: string; email: string; password: string }) {
    const endpoint = `${environment.api}/account/register`;
    return this.http.post<JWTUser>(endpoint, userData);
  }

  loginWithGoogle(): Observable<JWTUser> {
    return new Observable(observer => {
      if (!this.googleInitialized || typeof google === 'undefined') {
        observer.error(new Error('Google OAuth not initialized'));
        return;
      }

      const client = google.accounts.oauth2.initTokenClient({
        client_id: environment.googleClientId,
        scope: 'email profile',
        callback: (response: any) => {
          if (response.access_token) {
            // Exchange access token for ID token by calling Google's tokeninfo endpoint
            this.http.get<any>(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${response.access_token}`)
              .subscribe({
                next: (userInfo) => {
                  // Send email to backend to create/login user
                  const endpoint = `${environment.api}/account/google-login`;
                  this.http.post<JWTUser>(endpoint, { 
                    email: userInfo.email,
                    firstName: userInfo.given_name || '',
                    lastName: userInfo.family_name || '',
                    picture: userInfo.picture || '',
                    googleId: userInfo.sub 
                  }).subscribe({
                    next: (session) => observer.next(session),
                    error: (err) => observer.error(err)
                  });
                },
                error: (err) => observer.error(err)
              });
          } else {
            observer.error(new Error('No access token received'));
          }
        },
        error_callback: (error: any) => {
          observer.error(error);
        }
      });

      client.requestAccessToken();
    });
  }

  saveSession(session: JWTUser) {
    if (!this.isBrowser) return;
    console.log('Saving session to localStorage', this.sessionKey, session);
    localStorage.setItem(this.sessionKey, JSON.stringify(session));
  }

  getSession(): JWTUser | null {
    if (!this.isBrowser) return null;
    const data = localStorage.getItem(this.sessionKey);
    console.log('Reading session from localStorage', this.sessionKey);
    return data ? JSON.parse(data) as JWTUser : null;
  }

  logout() {
    if (!this.isBrowser) return;
    localStorage.removeItem(this.sessionKey);
  }

isExpired(session: JWTUser): boolean {
  const now = Math.floor(Date.now() / 1000);
  console.log('Checking expiry', { now, exp: session.exp });
  return session.exp <= now;
}

  isLoggedIn(): boolean {
    const session = this.getSession();
    return !!session && Date.now() < session.exp * 1000;
  }

  getToken(): string | null {
    return this.getSession()?.bearer ?? null;
  }

  isGod(): boolean {
    const session = this.getSession();
    return session?.is_god === true;
  }

  /**
   * Check god mode status from database (not JWT)
   * This ensures we get the current status even if JWT is stale
   */
  checkGodMode(): Observable<{ is_god: boolean }> {
    return this.apiService.get('/account/check-god-mode', false);
  }

  getUserId(): number {
    const session = this.getSession();
    return session?.user_id ?? 0;
  }

  getLoggedInUsername(): string | null {
    const session = this.getSession();
    return session?.username ?? null;
  }

  // ========== TOTP / 2FA Methods ==========

  /**
   * Setup TOTP for the authenticated user
   * Requires: JWT token
   * Returns: QR code URL, secret, and backup codes
   */
  setupTOTP(): Observable<TOTPSetupResponse> {
    return this.apiService.post('/account/totp/setup', {}, false);
  }

  /**
   * Verify TOTP setup by providing the first code
   * Requires: JWT token
   */
  verifyTOTPSetup(secret: string, code: string, backupCodes: string[]): Observable<any> {
    const request: TOTPVerifySetupRequest = { secret, code, backup_codes: backupCodes };
    return this.apiService.post('/account/totp/verify-setup', request, false);
  }

  /**
   * Verify TOTP code during login
   * No authentication required (part of login flow)
   */
  verifyTOTPLogin(username: string, code: string): Observable<JWTUser> {
    const endpoint = `${environment.api}/account/totp/verify-login`;
    const request: TOTPVerifyLoginRequest = { username, code };
    return this.http.post<JWTUser>(endpoint, request);
  }

  /**
   * Use a backup code to login
   * No authentication required (part of login flow)
   */
  useBackupCode(username: string, backupCode: string): Observable<JWTUser> {
    const endpoint = `${environment.api}/account/totp/use-backup`;
    const request: BackupCodeRequest = { username, backup_code: backupCode };
    return this.http.post<JWTUser>(endpoint, request);
  }

  /**
   * Disable TOTP for the authenticated user
   * Requires: JWT token and password confirmation
   */
  disableTOTP(password: string): Observable<any> {
    const request: TOTPDisableRequest = { password };
    return this.apiService.post('/account/totp/disable', request, false);
  }

  /**
   * Check if current user has TOTP enabled
   */
  hasTOTPEnabled(): boolean {
    const session = this.getSession();
    return session?.totp_enabled === true;
  }
}
