import { Component, EventEmitter, Inject, Input, Output, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../services/auth.service';
import { ApiService } from '../../../../services/api/api.service';

interface StoredToken {
  instance_id: number;
  access_token: string;
  expiry?: string;
}

@Component({
  selector: 'app-change-password-tool-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password-tool-modal.component.html',
  styleUrls: ['./change-password-tool-modal.component.scss']
})
export class ChangePasswordToolModalComponent {
  @Input() show = false;
  @Input() affiliateData: any = null;
  @Input() instanceApiEndpoint: string | null = null;
  @Input() mode: string = 'admin';
  @Output() close = new EventEmitter<void>();

  newPassword: string = '';
  sendEmailNotification: boolean = true;

  private readonly isBrowser: boolean;
  private resolvedInstanceApiEndpoint: string | null = null;
  private readonly LINKED_TOKENS_KEY = 'linked_tokens';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private api: ApiService,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  onClose(): void {
    this.close.emit();
  }

  get userId(): number | null {
    const rawId = this.affiliateData?.user_id;
    const parsed = Number(rawId);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private buildInstanceRoute(route: string): string | null {
    const base = (this.resolvedInstanceApiEndpoint || this.instanceApiEndpoint || '').trim();
    if (!base) {
      return null;
    }

    const cleanBase = base.replace(/\/+$/, '');
    const cleanMode = (this.mode || 'admin').replace(/^\/+|\/+$/g, '');
    const cleanRoute = route.replace(/^\/+/, '');
    return `${cleanBase}/${cleanMode}/${cleanRoute}`;
  }

  private async getAuthHeaders(): Promise<HttpHeaders> {
    let token = this.getInstanceJwtToken();
    
    // If no instance token exists, try to authenticate
    if (!token) {
      token = await this.authenticateToInstance();
    }
    
    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      'Authorization': `${token}`,
      'Content-Type': 'application/json'
    });
  }

  private async authenticateToInstance(): Promise<string | null> {
    if (!this.isBrowser || !this.userId) {
      return null;
    }

    const instanceId = Number(this.affiliateData?.instance_id);
    if (!Number.isFinite(instanceId) || instanceId <= 0) {
      return null;
    }

    try {
      await this.ensureInstanceApiEndpoint();
      const endpoint = this.buildInstanceRoute(`account/remote-login/${this.userId}`);
      
      if (!endpoint) {
        console.error('Cannot build remote login endpoint');
        return null;
      }

      // Use management API token for remote login
      const managementToken = this.auth.getToken();
      const headers = new HttpHeaders({
        'Authorization': `${managementToken}`,
        'Content-Type': 'application/json'
      });

      const response = await firstValueFrom(this.http.get<any>(endpoint, { headers }));
      
      if (response?.payload?.jwt) {
        const jwt = response.payload.jwt;
        const expiry = response.payload.expiry;
        
        // Store the token in localStorage
        this.storeInstanceToken(instanceId, jwt, expiry);
        
        return jwt;
      }
      
      return null;
    } catch (error) {
      console.error('Error authenticating to instance API:', error);
      return null;
    }
  }

  private storeInstanceToken(instanceId: number, token: string, expiry?: string): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      const raw = localStorage.getItem(this.LINKED_TOKENS_KEY);
      let tokens: StoredToken[] = [];
      
      if (raw) {
        tokens = JSON.parse(raw) as StoredToken[];
      }
      
      // Remove any existing token for this instance
      tokens = tokens.filter(t => Number(t.instance_id) !== instanceId);
      
      // Add the new token
      tokens.push({
        instance_id: instanceId,
        access_token: token,
        expiry: expiry
      });
      
      localStorage.setItem(this.LINKED_TOKENS_KEY, JSON.stringify(tokens));
    } catch (error) {
      console.error('Error storing instance token:', error);
    }
  }

  private getInstanceJwtToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    const instanceId = Number(this.affiliateData?.instance_id);
    if (!Number.isFinite(instanceId) || instanceId <= 0) {
      return null;
    }

    try {
      const raw = localStorage.getItem(this.LINKED_TOKENS_KEY);
      if (!raw) {
        return null;
      }

      const tokens = JSON.parse(raw) as StoredToken[];
      const token = tokens.find(t => Number(t.instance_id) === instanceId);

      if (!token?.access_token) {
        return null;
      }

      if (token.expiry) {
        const expiryDate = new Date(token.expiry);
        if (!Number.isNaN(expiryDate.getTime()) && expiryDate < new Date()) {
          return null;
        }
      }

      return token.access_token;
    } catch (error) {
      console.error('Error reading linked instance token:', error);
      return null;
    }
  }

  private async postToInstance(route: string, body: any): Promise<any> {
    await this.ensureInstanceApiEndpoint();

    const endpoint = this.buildInstanceRoute(route);
    if (!endpoint) {
      throw new Error('Instance API endpoint is not configured');
    }

    const headers = await this.getAuthHeaders();
    return await firstValueFrom(this.http.post<any>(endpoint, JSON.stringify(body), { headers }));
  }

  private async ensureInstanceApiEndpoint(): Promise<void> {
    if (this.resolvedInstanceApiEndpoint) {
      return;
    }

    const fromInput = (this.instanceApiEndpoint || '').trim();
    if (fromInput) {
      this.resolvedInstanceApiEndpoint = fromInput;
      return;
    }

    const instanceId = Number(this.affiliateData?.instance_id);
    if (!Number.isFinite(instanceId) || instanceId <= 0) {
      return;
    }

    try {
      const response = await firstValueFrom(this.api.get(`/clients/instance/${instanceId}`, false));
      const apiEndpoint = (response?.api_endpoint || '').trim();
      if (apiEndpoint) {
        this.resolvedInstanceApiEndpoint = apiEndpoint;
      }
    } catch (error) {
      console.error('Error resolving instance API endpoint:', error);
    }
  }

  async changePassword(): Promise<void> {
    if (!this.userId || !this.newPassword) {
      this.toastr.error('Please enter a new password', 'Error');
      return;
    }

    try {
      const response = await this.postToInstance('account/reset-password', {
        user_id: this.userId,
        password: this.newPassword,
        email: this.sendEmailNotification ? 1 : 0
      });

      if (response && response.code === 200) {
        this.toastr.success('Password updated successfully!', 'Success');
        this.newPassword = '';
        this.sendEmailNotification = true;
      } else {
        this.toastr.error('Failed to update password', 'Error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      this.toastr.error('Failed to update password. Please try again.', 'Error');
    }
  }
}
