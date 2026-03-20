import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { GofiliateService } from '../../../services/gofiliate.service';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api/api.service';
import { ToastrService } from 'ngx-toastr';
import { TotpChallengeComponent } from '../../shared/totp-challenge/totp-challenge.component';

interface Manager {
  user_id: number;
  username: string;
  full_name: string;
  user_role: string;
}

@Component({
  selector: 'app-instance-login-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, TotpChallengeComponent],
  templateUrl: './instance-login-widget.component.html',
  styleUrl: './instance-login-widget.component.scss'
})
export class InstanceLoginWidgetComponent implements OnInit {
  @Input() widgetData: any;

  instanceData: any = null;
  isLoading = false;
  error: string | null = null;
  widgetConfig: any = null;

  // Login-related properties
  canLogin = false;
  isGod = false;
  managers: Manager[] = [];
  showManagerSelectionModal = false;
  selectedManagerUserId: number | null = null;
  showTotpChallenge = false;
  loginUsername = '';

  constructor(
    private gofiliateService: GofiliateService,
    private authService: AuthService,
    private api: ApiService,
    private http: HttpClient,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    console.log('InstanceLoginWidget initialized with data:', this.widgetData);

    this.isGod = this.authService.isGod();
    this.checkCanLogin();

    // Parse widget_config if present
    if (this.widgetData?.widget_config) {
      try {
        this.widgetConfig = typeof this.widgetData.widget_config === 'string' 
          ? JSON.parse(this.widgetData.widget_config) 
          : this.widgetData.widget_config;
        console.log('Parsed widget config:', this.widgetConfig);
      } catch (e) {
        console.error('Failed to parse widget_config:', e);
      }
    }

    // Get reference_id from config or widget data
    const referenceId = this.getReferenceId();
    if (referenceId) {
      this.loadInstanceData(referenceId);
    }
  }

  // Get the display title (custom_title from config, or header from widget)
  getDisplayTitle(): string {
    return this.widgetConfig?.custom_title || this.widgetData?.header || 'Widget';
  }

  // Get reference_id from config or widget data
  private getReferenceId(): number | null {
    const configRefId = this.widgetConfig?.reference_id;
    const widgetRefId = this.widgetData?.reference_id;
    
    // Try config first (as string or number)
    if (configRefId) {
      const parsed = typeof configRefId === 'string' ? parseInt(configRefId, 10) : configRefId;
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    
    // Fallback to widget reference_id
    return widgetRefId || null;
  }

  private loadInstanceData(instanceId: number): void {
    this.isLoading = true;
    
    // Load full instance data including endpoints and is_public flag
    this.api.get(`/clients/instance/${instanceId}`, false).subscribe({
      next: (response: any) => {
        this.instanceData = response;
        this.isLoading = false;
        console.log('Instance data loaded:', this.instanceData);
      },
      error: (err) => {
        console.error('Error loading instance data:', err);
        this.error = 'Failed to load instance details';
        this.isLoading = false;
      }
    });
  }

  // Check if current user can login
  private checkCanLogin(): void {
    const username = this.authService.getLoggedInUsername();
    if (!username) {
      return;
    }

    this.api.get(`/account/users/can-login/${username}`, false).subscribe({
      next: (response: any) => {
        this.canLogin = response?.can_login === true;
        console.log('Can login:', this.canLogin);
      },
      error: (err) => {
        console.error('Error checking can_login:', err);
        this.canLogin = false;
      }
    });
  }

  // Handle login button click
  onLoginClick(): void {
    if (!this.instanceData) {
      this.toast.error('Instance data not loaded');
      return;
    }

    if (!this.canLogin) {
      this.toast.warning('You do not have permission to login to instances');
      return;
    }

    // Load managers if GOD user
    if (this.isGod) {
      this.loadManagers();
    } else {
      // Regular user: proceed with their own credentials
      this.loginUsername = this.authService.getLoggedInUsername() || '';
      this.proceedToLogin();
    }
  }

  // Load managers for GOD user selection
  private loadManagers(): void {
    const instanceId = this.instanceData.instance_id;
    
    this.api.get(`/clients/instance/user-accounts/${instanceId}`, false).subscribe({
      next: (accounts: any) => {
        // Convert account format to manager format
        const managers = (accounts || []).map((acc: any) => ({
          user_id: acc.user_id,
          username: acc.account_username,
          full_name: acc.account_username, // Use username as full_name if not available
          user_role: acc.account_role_label
        }));
        
        if (managers && managers.length > 0) {
          this.managers = managers;
          this.showManagerSelectionModal = true;
        } else {
          this.toast.error('No managers found for this instance');
        }
      },
      error: (err) => {
        console.error('Error loading managers:', err);
        this.toast.error('Failed to load account managers');
      }
    });
  }

  // Proceed with selected manager or current user
  proceedWithManagerOrCurrentUser(): void {
    if (this.isGod && !this.selectedManagerUserId) {
      this.toast.warning('Please select a manager');
      return;
    }

    // Get selected manager username
    if (this.isGod && this.selectedManagerUserId) {
      const manager = this.managers.find(m => m.user_id === this.selectedManagerUserId);
      if (manager) {
        this.loginUsername = manager.username;
      }
    }

    this.showManagerSelectionModal = false;
    this.proceedToLogin();
  }

  // Proceed to TOTP or direct login (for public instances)
  private proceedToLogin(): void {
    // Check if instance is public (skip TOTP)
    if (this.instanceData.is_public === 1) {
      this.createLoginRequest(null);
    } else {
      // Show TOTP challenge
      this.showTotpChallenge = true;
    }
  }

  // Handle TOTP verification success
  handleTotpVerification(code: string): void {
    this.createLoginRequest(code);
  }

  // Handle TOTP cancel
  handleTotpCancel(): void {
    this.showTotpChallenge = false;
  }

  // Create login request and redirect
  private createLoginRequest(totpCode: string | null): void {
    const instanceId = this.instanceData.instance_id;
    const apiEndpoint = this.instanceData.api_endpoint;
    const adminEndpoint = this.instanceData.admin_endpoint;

    if (!apiEndpoint || !adminEndpoint) {
      this.toast.error('Instance endpoints not configured');
      return;
    }

    // Get user_id: for PUBLIC instances use admin_id 1, otherwise use selected manager or current user
    let userId: number | null = null;
    
    if (this.instanceData.is_public === 1) {
      // Public instances default to admin_id 1
      userId = 1;
      console.log('Public instance - using default admin_id: 1');
    } else if (this.isGod && this.selectedManagerUserId) {
      // GOD user selected a manager
      userId = this.selectedManagerUserId;
    } else {
      // Regular user - use their own ID
      userId = this.authService.getUserId();
    }

    if (!userId) {
      this.toast.error('User ID not found');
      return;
    }

    const loginData = {
      user_id: userId
    };

    // Call IP-restricted login endpoint (admin mode)
    const loginUrl = `${apiEndpoint}/admin/ip-restricted/login-request`;
    
    this.http.post<any>(loginUrl, loginData).subscribe({
      next: (response) => {
        const validationToken = response?.payload?.validation_token;
        
        if (validationToken) {
          // Open admin portal with validation token and API endpoint
          // Encode API endpoint to safely pass as query parameter
          const encodedApi = encodeURIComponent(apiEndpoint);
          const portalUrl = `${adminEndpoint}/2fa/${validationToken}?api=${encodedApi}`;
          window.open(portalUrl, '_blank');
          
          this.toast.success('Login request created successfully');
          this.showTotpChallenge = false;
        } else {
          this.toast.error('No validation token received');
        }
      },
      error: (err) => {
        console.error('Error creating login request:', err);
        this.toast.error('Failed to create login request');
        this.showTotpChallenge = false;
      }
    });
  }

  // Close manager selection modal
  closeManagerModal(): void {
    this.showManagerSelectionModal = false;
    this.selectedManagerUserId = null;
  }
}
