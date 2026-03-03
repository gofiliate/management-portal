import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ApiService } from '../../../services/api/api.service';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { AccountSyncService } from '../../../services/sync/account-sync.service';
import { AffiliateSyncService } from '../../../services/sync/affiliate-sync.service';
import { BrandSyncService } from '../../../services/sync/brand-sync.service';
import { LandingPageSyncService } from '../../../services/sync/landing-page-sync.service';
import { InterfaceSyncService } from '../../../services/sync/interface-sync.service';
import { LoginModalComponent } from '../../shared/login-modal/login-modal.component';
import { ConfirmationModalComponent } from '../../shared/confirmation-modal/confirmation-modal.component';
import { TotpChallengeComponent } from '../../shared/totp-challenge/totp-challenge.component';
import { AccountManagersSummaryComponent } from '../account-managers-summary/account-managers-summary.component';
import { AffiliatesSummaryComponent } from '../affiliates-summary/affiliates-summary.component';
import { BrandsSummaryComponent } from '../brands-summary/brands-summary.component';
import { LandingPagesSummaryComponent } from '../landing-pages-summary/landing-pages-summary.component';

interface InstanceDetails {
  instance_id: number;
  instance_name: string;
  hostname: string;
  ip_address: string;
  api_endpoint: string;
  ad_endpoint?: string;
  aff_endpoint: string;
  admin_endpoint: string;
  api_key: string;
  jwt_key?: string;
  heartbeat_port?: number;
  is_single_brand: number;
  is_live: number;
  created: string;
  updated: string;
  status: number;
  client_logo?: string;
}

interface StoredToken {
  instance_id: number;
  instance_name: string;
  access_token: string;
  role_id: number;
  username: string;
  expiry: string;
  stored_at: string;
}

interface Manager {
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

interface Role {
  role_id: number;
  description: string;
  interface_id: number;
  language_replacement: string;
  active: number;
  protected: number;
}

@Component({
  selector: 'app-manage-instance',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule, LoginModalComponent, ConfirmationModalComponent, TotpChallengeComponent, AccountManagersSummaryComponent, AffiliatesSummaryComponent, BrandsSummaryComponent, LandingPagesSummaryComponent],
  templateUrl: './manage-instance.component.html',
  styleUrl: './manage-instance.component.scss'
})
export class ManageInstanceComponent implements OnInit {
  
  public instanceId: number = 0;
  public loading = false;
  public statusActive = true;
  public singleBrandActive = true;
  public liveActive = false;
  public showLinkModal = false;
  public showJWTModal = false;
  public showRemoveConfirmModal = false;
  public showAPIKeyModal = false;
  public showJWTKeyModal = false;
  public editAPIKey = false;
  public editJWTKey = false;
  public linkedToken: StoredToken | null = null;
  private readonly STORAGE_KEY = 'linked_tokens';
  public isGod = false;
  public managers: Manager[] = [];
  public affiliates: any[] = [];
  public brands: any[] = [];
  public textLinks: any[] = [];
  public geoGroups: any[] = [];
  public roles: Role[] = [];
  public syncing = false;
  public lastSyncWasForced = false;
  public lastAffiliatesSyncWasForced = false;
  public lastBrandsSyncWasForced = false;
  public lastLandingPagesSyncWasForced = false;
  public currentSection: 'users' | 'affiliates' | 'brands' | 'landing-pages' | null = null;
  public canLogin = false;
  public checkingCanLogin = false;
  public showManagerSelectionModal = false;
  public showTotpChallenge = false;
  public selectedManagerUserId: number | null = null;
  public loginUsername: string = '';
  public instance: InstanceDetails = {
    instance_id: 0,
    instance_name: '',
    hostname: '',
    ip_address: '',
    api_endpoint: '',
    ad_endpoint: '',
    aff_endpoint: '',
    admin_endpoint: '',
    api_key: '',
    jwt_key: '',
    heartbeat_port: undefined,
    is_single_brand: 1,
    is_live: 0,
    created: '',
    updated: '',
    status: 1
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private auth: AuthService,
    private toast: ToastrService,
    private http: HttpClient,
    private accountSync: AccountSyncService,
    private affiliateSync: AffiliateSyncService,
    private brandSync: BrandSyncService,
    private landingPageSync: LandingPageSyncService,
    private interfaceSync: InterfaceSyncService
  ) {}

  ngOnInit(): void {
    this.isGod = this.auth.isGod();
    this.route.params.subscribe(params => {
      this.instanceId = +params['id'];
      this.loadInstanceDetails();
      this.loadLinkedToken();
      this.checkCurrentUserCanLogin();
      this.loadAccountManagersFromDB();
    });
  }

  loadInstanceDetails(): void {
    this.loading = true;
    
    this.api.get(`/clients/instance/${this.instanceId}`, false).subscribe({
      next: (data: InstanceDetails) => {
        this.instance = data;
        this.statusActive = data.status === 1;
        this.singleBrandActive = data.is_single_brand === 1;
        this.liveActive = data.is_live === 1;
        
        // If keys are empty and user is a god, enable edit mode for easier setup
        if (this.isGod) {
          if (!this.instance.api_key || this.instance.api_key === '') {
            this.editAPIKey = true;
          }
          if (!this.instance.jwt_key || this.instance.jwt_key === '') {
            this.editJWTKey = true;
          }
        }
        
        this.loading = false;
      },
      error: (error) => {
        this.toast.error('Cannot get instance details from the API. Please try again later', 'API Error');
        this.loading = false;
        console.error('Error loading instance details:', error);
      }
    });
  }

  onStatusChange(): void {
    this.instance.status = this.statusActive ? 1 : 0;
  }

  onSingleBrandChange(): void {
    this.instance.is_single_brand = this.singleBrandActive ? 1 : 0;
  }

  onLiveChange(): void {
    this.instance.is_live = this.liveActive ? 1 : 0;
  }

  onSave(): void {
    // Validate required fields
    if (!this.instance.instance_name || !this.instance.hostname || 
        !this.instance.ip_address || !this.instance.api_endpoint) {
      this.toast.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    // Only GODs can validate and modify api_key
    if (this.isGod && !this.instance.api_key) {
      this.toast.error('API Key is required', 'Validation Error');
      return;
    }

    const payload: any = {
      client_id: 0, // Not required for edit operation
      instance_id: this.instance.instance_id,
      action: 'edit',
      instance_name: this.instance.instance_name,
      client_logo: this.instance.client_logo || '',
      hostname: this.instance.hostname,
      ip_address: this.instance.ip_address,
      api_endpoint: this.instance.api_endpoint,
      ad_endpoint: this.instance.ad_endpoint || null,
      aff_endpoint: this.instance.aff_endpoint,
      admin_endpoint: this.instance.admin_endpoint,
      heartbeat_port: this.instance.heartbeat_port || null,
      is_single_brand: this.instance.is_single_brand,
      is_live: this.instance.is_live
    };

    // Only GODs can send api_key and jwt_key
    if (this.isGod) {
      payload.api_key = this.instance.api_key;
      payload.jwt_key = this.instance.jwt_key || null;
    }

    this.api.post('/clients/instance', payload, false).subscribe({
      next: (response) => {
        this.toast.success('Instance updated successfully', 'Success');
        this.loadInstanceDetails(); // Refresh the data
      },
      error: (error) => {
        this.toast.error('Failed to update instance. Please try again.', 'API Error');
        console.error('Error updating instance:', error);
      }
    });
  }

  onDelete(): void {
    if (confirm('Are you sure you want to delete this instance?')) {
      console.log('Deleting instance:', this.instanceId);
      // TODO: Implement delete functionality
    }
  }

  testAPI(): void {
    if (!this.instance.api_endpoint) {
      this.toast.error('API Endpoint is not configured', 'Test Failed');
      return;
    }

    const heartbeatUrl = `${this.instance.api_endpoint}/heartbeat`;
    this.toast.info('Testing API connection...', 'Testing');

    this.http.get(heartbeatUrl, { observe: 'response', responseType: 'text' }).subscribe({
      next: (response) => {
        if (response.status >= 200 && response.status < 300) {
          this.toast.success(`API is reachable! Status: ${response.status}`, 'Test Successful');
        } else {
          this.toast.warning(`API responded with status: ${response.status}`, 'Test Warning');
        }
      },
      error: (err) => {
        this.toast.error(`API is not reachable. ${err.statusText || 'Connection failed'}`, 'Test Failed');
      }
    });
  }

  testIntegration(): void {
    if (!this.instance.api_endpoint) {
      this.toast.error('API Endpoint is not configured', 'Test Failed');
      return;
    }

    if (!this.instance.api_key) {
      this.toast.error('API Key is not configured', 'Test Failed');
      return;
    }

    const authUrl = `${this.instance.api_endpoint}/admin/ip-restricted/integration`;
    const headers = { 'Authorization': this.instance.api_key };
    this.toast.info('Testing integration authorization...', 'Testing');

    this.http.get(authUrl, { headers, observe: 'response', responseType: 'text' }).subscribe({
      next: (response) => {
        if (response.status >= 200 && response.status < 300) {
          this.toast.success('Integration is authorized! Access granted.', 'Test Successful');
        } else {
          this.toast.warning(`Integration responded with status: ${response.status}`, 'Test Warning');
        }
      },
      error: (err) => {
        if (err.status === 404) {
          this.toast.error('Integration route not found (404)', 'Test Failed');
        } else if (err.status === 401 || err.status === 403) {
          this.toast.error('Integration access denied. Check API Key and IP restrictions.', 'Test Failed');
        } else {
          this.toast.error(`Integration test failed. ${err.statusText || 'Connection error'}`, 'Test Failed');
        }
      }
    });
  }

  openLinkModal(): void {
    this.showLinkModal = true;
  }

  public closeLinkModal(): void {
    this.showLinkModal = false;
  }

  public handleLoginConnect(credentials: {username: string, password: string, mode?: string}): void {
    if (!this.instance.api_endpoint) {
      this.toast.error('API Endpoint is not configured', 'Connection Error');
      return;
    }

    const mode = credentials.mode || 'admin';
    const loginUrl = `${this.instance.api_endpoint}/${mode}/v2/account/login`;
    const payload = {
      username: credentials.username,
      password: credentials.password
    };

    this.toast.info('Connecting to platform...', 'Connecting');

    this.http.post(loginUrl, payload, { observe: 'response' }).subscribe({
      next: (response: any) => {
        console.log('Platform admin login response:', response);
        console.log('Response body:', response.body);
        console.log('Response status:', response.status);
        
        if (response.body && response.body.payload) {
          const tokenData = response.body.payload;
          this.saveLinkedToken({
            instance_id: this.instance.instance_id,
            instance_name: this.instance.instance_name,
            access_token: tokenData.access_token,
            role_id: tokenData.role_id,
            username: credentials.username,
            expiry: tokenData.expiry,
            stored_at: new Date().toISOString()
          });
          this.toast.success('Successfully connected to platform!', 'Success');
        }
        this.closeLinkModal();
      },
      error: (err) => {
        console.log('Platform admin login error:', err);
        console.log('Error status:', err.status);
        console.log('Error body:', err.error);
        
        if (err.status === 401) {
          this.toast.error('Invalid credentials', 'Login Failed');
        } else if (err.status === 404) {
          this.toast.error('Login endpoint not found', 'Connection Error');
        } else {
          this.toast.error(`Connection failed: ${err.statusText || 'Unknown error'}`, 'Error');
        }
      }
    });
  }

  private loadLinkedToken(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      const tokens: StoredToken[] = JSON.parse(stored);
      const token = tokens.find(t => t.instance_id === this.instanceId);
      
      if (token) {
        // Check if token is expired
        if (this.isTokenExpiredCheck(token.expiry)) {
          // Remove expired token
          this.removeExpiredToken(token.instance_id);
          this.toast.warning('Your authentication token has expired. Please re-authenticate.', 'Token Expired');
          this.linkedToken = null;
        } else {
          this.linkedToken = token;
        }
      } else {
        this.linkedToken = null;
      }
    }
  }

  private saveLinkedToken(token: StoredToken): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    let tokens: StoredToken[] = stored ? JSON.parse(stored) : [];
    
    // Remove existing token for this instance
    tokens = tokens.filter(t => t.instance_id !== token.instance_id);
    
    // Add new token
    tokens.push(token);
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokens));
    this.linkedToken = token;
  }

  public openRemoveConfirmModal(): void {
    this.showRemoveConfirmModal = true;
  }

  public closeRemoveConfirmModal(): void {
    this.showRemoveConfirmModal = false;
  }

  public confirmRemoveToken(): void {
    this.removeExpiredToken(this.instanceId);
    this.toast.success('Token removed successfully', 'Success');
    this.showRemoveConfirmModal = false;
  }

  private removeExpiredToken(instanceId: number): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      let tokens: StoredToken[] = JSON.parse(stored);
      tokens = tokens.filter(t => t.instance_id !== instanceId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokens));
      this.linkedToken = null;
    }
  }

  private isTokenExpiredCheck(expiry: string): boolean {
    const expiryDate = new Date(expiry);
    return expiryDate < new Date();
  }

  public isTokenExpired(): boolean {
    if (!this.linkedToken) return true;
    return this.isTokenExpiredCheck(this.linkedToken.expiry);
  }

  public inspectJWT(): void {
    if (this.linkedToken) {
      this.showJWTModal = true;
    }
  }

  public closeJWTModal(): void {
    this.showJWTModal = false;
  }

  public copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.toast.success('Copied to clipboard', 'Success');
    }).catch(() => {
      this.toast.error('Failed to copy', 'Error');
    });
  }

  public checkCurrentUserCanLogin(): void {
    const session = this.auth.getSession();
    if (!session || !session.username) {
      this.canLogin = false;
      return;
    }

    this.checkingCanLogin = true;
    this.api.get(`/account/users/can-login/${session.username}`, false).subscribe({
      next: (response: any) => {
        this.canLogin = response.can_login || false;
        console.log(`Current user ${session.username} can_login: ${this.canLogin}`);
        this.checkingCanLogin = false;
      },
      error: (err) => {
        console.error('Error checking can_login status:', err);
        this.canLogin = false;
        this.checkingCanLogin = false;
      }
    });
  }

  public handleLogin(): void {
    const session = this.auth.getSession();
    if (!session) {
      this.toast.error('You must be logged in', 'Authentication Error');
      return;
    }

    // Check if user is GOD
    if (this.isGod) {
      // GODs can impersonate - show manager selection modal
      this.showManagerSelectionModal = true;
    } else {
      // Regular users proceed directly to TOTP challenge
      this.loginUsername = session.username;
      this.showTotpChallenge = true;
    }
  }

  public closeManagerSelectionModal(): void {
    this.showManagerSelectionModal = false;
    this.selectedManagerUserId = null;
  }

  public proceedWithSelectedManager(): void {
    if (!this.selectedManagerUserId) {
      this.toast.error('Please select a manager', 'Selection Required');
      return;
    }

    const selectedManager = this.managers.find(m => m.user_id === this.selectedManagerUserId);
    if (!selectedManager) {
      this.toast.error('Selected manager not found', 'Error');
      return;
    }

    this.loginUsername = selectedManager.username;
    this.showManagerSelectionModal = false;
    this.showTotpChallenge = true;
  }

  public handleTotpVerification(code: string): void {
    console.log('TOTP verification for user:', this.loginUsername, 'Code:', code);
    this.toast.info('Creating login request...', 'Processing');
    
    // TODO: Regular users need to use their configured account manager from permissions
    // For now, only GOD users with selectedManagerUserId will work
    const userId = this.selectedManagerUserId;
    
    if (!userId) {
      this.toast.error('Manager user ID not available - configured manager feature required', 'Error');
      return;
    }

    if (!this.instance.api_endpoint) {
      this.toast.error('API Endpoint is not configured', 'Configuration Error');
      return;
    }

    // Call IP-restricted endpoint to create login request
    const mode = 'admin'; // Default to admin mode
    const loginRequestUrl = `${this.instance.api_endpoint}/${mode}/ip-restricted/login-request`;
    const payload = {
      user_id: userId
    };

    console.log('Creating login request at:', loginRequestUrl);
    console.log('Payload:', payload);

    this.http.post(loginRequestUrl, payload).subscribe({
      next: (response: any) => {
        console.log('Login request response:', response);
        
        if (response && response.payload && response.payload.validation_token) {
          const validationToken = response.payload.validation_token;
          
          // Build admin portal access URL and open in new tab
          const adminAccessUrl = `${this.instance.admin_endpoint}/2fa/${validationToken}`;
          
          console.log('Opening admin portal:', adminAccessUrl);
          window.open(adminAccessUrl, '_blank');
          
          this.toast.success('Opening admin portal in new tab...', 'Success');
          this.closeTotpChallenge();
        } else {
          console.error('No validation_token in response:', response);
          this.toast.error('Invalid response from server', 'Error');
        }
      },
      error: (err) => {
        console.error('Error creating login request:', err);
        console.error('Error status:', err.status);
        console.error('Error body:', err.error);
        
        if (err.status === 403) {
          this.toast.error('Access denied - IP restriction or rate limit', 'Forbidden');
        } else if (err.status === 404) {
          this.toast.error('Login request endpoint not found', 'Connection Error');
        } else {
          this.toast.error(`Failed to create login request: ${err.statusText || 'Unknown error'}`, 'Error');
        }
      }
    });
  }

  public closeTotpChallenge(): void {
    this.showTotpChallenge = false;
    this.loginUsername = '';
    this.selectedManagerUserId = null;
  }

  public getObfuscatedKey(key: string): string {
    if (!key || key.length < 8) return '****';
    const first4 = key.substring(0, 4);
    const last3 = key.substring(key.length - 3);
    const starsCount = Math.min(key.length - 7, 12); // Cap the stars at 12
    return `${first4}${'*'.repeat(starsCount)}${last3}`;
  }

  public get apiKeyDisplay(): string {
    if (!this.instance.api_key) return '';
    // Non-GODs always see obfuscated, GODs see based on edit state
    if (!this.isGod) return this.getObfuscatedKey(this.instance.api_key);
    return this.editAPIKey ? this.instance.api_key : this.getObfuscatedKey(this.instance.api_key);
  }

  public set apiKeyDisplay(value: string) {
    // Only GODs can edit
    if (this.isGod && this.editAPIKey) {
      this.instance.api_key = value;
    }
  }

  public get jwtKeyDisplay(): string {
    if (!this.instance.jwt_key) return '';
    // Non-GODs always see obfuscated, GODs see based on edit state
    if (!this.isGod) return this.getObfuscatedKey(this.instance.jwt_key);
    return this.editJWTKey ? this.instance.jwt_key : this.getObfuscatedKey(this.instance.jwt_key);
  }

  public set jwtKeyDisplay(value: string) {
    // Only GODs can edit
    if (this.isGod && this.editJWTKey) {
      this.instance.jwt_key = value;
    }
  }

  public viewAPIKey(): void {
    if (!this.isGod) {
      this.toast.error('Access denied. GOD privileges required.', 'Unauthorized');
      return;
    }
    this.showAPIKeyModal = true;
  }

  public closeAPIKeyModal(): void {
    this.showAPIKeyModal = false;
  }

  public viewJWTKey(): void {
    if (!this.isGod) {
      this.toast.error('Access denied. GOD privileges required.', 'Unauthorized');
      return;
    }
    this.showJWTKeyModal = true;
  }

  public closeJWTKeyModal(): void {
    this.showJWTKeyModal = false;
  }

  public toggleEditAPIKey(): void {
    if (!this.isGod) return;
    this.editAPIKey = !this.editAPIKey;
  }

  public toggleEditJWTKey(): void {
    if (!this.isGod) return;
    this.editJWTKey = !this.editJWTKey;
  }

  public managePlatformSection(section: string): void {
    if (!this.linkedToken) {
      this.toast.warning('Please connect a platform administrator account first', 'Account Required');
      return;
    }

    if (section === 'emails') {
      this.router.navigate(['/clients/manage-emails', this.instanceId]);
      return;
    }

    if (section === 'terms-conditions') {
      this.router.navigate(['/clients/manage-terms-conditions', this.instanceId]);
      return;
    }
    
    if (section === 'users') {
      this.currentSection = 'users';
      console.log('Account Managers section selected - loading from database');
      this.loadAccountManagersFromDB();
    } else if (section === 'affiliates') {
      this.currentSection = 'affiliates';
      console.log('Affiliates section selected - loading from database');
      this.loadCachedAffiliates();
    } else if (section === 'brands') {
      this.currentSection = 'brands';
      console.log('Brands section selected - loading from database');
      this.loadCachedBrands();
    } else if (section === 'landing-pages') {
      this.currentSection = 'landing-pages';
      console.log('Landing Pages section selected - loading from database');
      this.loadCachedLandingPages();
    } else {
      this.toast.info(`Opening ${section} management...`, 'Coming Soon');
      console.log('Platform section requested:', section);
    }
  }

  public syncAll(): void {
    if (!this.linkedToken) {
      this.toast.warning('Please connect a platform administrator account first', 'Account Required');
      return;
    }

    this.syncing = true;
    console.log('Syncing all platform data...');

    this.interfaceSync.syncAll(this.instanceId, this.instance.api_endpoint, this.linkedToken.access_token).subscribe({
      next: (result) => {
        this.syncing = false;

        if (result.success) {
          console.log('Sync all successful:', result);
          
          // Update managers if available
          if (result.results.accounts && result.results.accounts.success) {
            this.managers = result.results.accounts.managers;
            this.fetchPlatformRoles();
          }

          // Log affiliates data for inspection
          if (result.results.affiliates) {
            console.log('[ManageInstance] Affiliates sync result:', result.results.affiliates);
            console.log('[ManageInstance] Affiliates count:', result.results.affiliates.affiliates?.length || 0);
          }

          this.toast.success(`Synced ${result.totalSynced} records successfully`, 'Sync Complete');
        } else {
          console.error('Sync all had errors:', result.errors);
          this.toast.error(`Sync completed with errors: ${result.errors.join(', ')}`, 'Sync Errors');
        }
      },
      error: (error) => {
        console.error('Error during sync all:', error);
        this.syncing = false;
        this.toast.error('Failed to sync all data', 'Error');
      }
    });
  }

  private loadAccountManagersFromDB(): void {
    console.log('Loading account managers from management-api DB...');
    
    this.accountSync.loadFromCache(this.instanceId).subscribe({
      next: (result) => {
        if (result.success && result.managers.length > 0) {
          console.log('Loaded accounts from cache:', result.managers);
          this.managers = result.managers;
          this.lastSyncWasForced = false;
          this.fetchPlatformRoles();
        } else {
          // No data in DB, fetch from instance API and save
          console.log('No cached data found, fetching from instance API...');
          this.syncAccountManagers();
        }
      },
      error: (error) => {
        console.error('Error loading from DB:', error);
        // If DB fails, try fetching from instance API
        this.syncAccountManagers();
      }
    });
  }

  private fetchAccountManagers(): void {
    const apiUrl = `${this.instance.api_endpoint}/admin/settings/permissions/affiliate-managers`;
    const headers = {
      'Authorization': this.linkedToken!.access_token
    };

    console.log('Fetching account managers from:', apiUrl);
    
    this.http.get<Manager[]>(apiUrl, { headers }).subscribe({
      next: (response) => {
        console.log('Account Managers Response:', response);
        this.managers = response;
        this.fetchPlatformRoles();
        this.toast.success('Account managers loaded successfully', 'Success');
      },
      error: (error) => {
        console.error('Error fetching account managers:', error);
        this.toast.error('Failed to load account managers', 'Error');
      }
    });
  }

  public syncAccountManagers(): void {
    if (!this.linkedToken) {
      this.toast.warning('Please connect a platform administrator account first', 'Account Required');
      return;
    }

    this.syncing = true;
    this.lastSyncWasForced = false;
    console.log('Syncing account managers from instance API...');
    
    this.accountSync.sync(this.instanceId, this.instance.api_endpoint, this.linkedToken.access_token).subscribe({
      next: (result) => {
        this.syncing = false;
        
        if (result.success) {
          console.log('Successfully synced account managers:', result);
          this.managers = result.managers;
          this.fetchPlatformRoles();
          this.toast.success('Account managers synced successfully', 'Success');
        } else {
          console.error('Sync failed:', result.error);
          this.toast.error(result.error || 'Failed to sync account managers', 'Error');
        }
      },
      error: (error) => {
        console.error('Error syncing account managers:', error);
        this.syncing = false;
        this.toast.error('Failed to sync account managers', 'Error');
      }
    });
  }

  public forceSyncAccountManagers(): void {
    if (!this.linkedToken) {
      this.toast.warning('Please connect a platform administrator account first', 'Account Required');
      return;
    }

    this.syncing = true;
    this.lastSyncWasForced = true;
    console.log('Force syncing account managers from instance API (will create new entries)...');
    
    this.accountSync.forceSync(this.instanceId, this.instance.api_endpoint, this.linkedToken.access_token).subscribe({
      next: (result) => {
        this.syncing = false;
        
        if (result.success) {
          console.log('Successfully force synced account managers:', result);
          this.managers = result.managers;
          this.fetchPlatformRoles();
          const count = result.inserted || 0;
          this.toast.success(`Force synced: ${count} new ${count === 1 ? 'entry' : 'entries'} created`, 'Success');
        } else {
          console.error('Force sync failed:', result.error);
          this.toast.error(result.error || 'Failed to force sync account managers', 'Error');
        }
      },
      error: (error) => {
        console.error('Error force syncing account managers:', error);
        this.syncing = false;
        this.toast.error('Failed to force sync account managers', 'Error');
      }
    });
  }

  private fetchPlatformRoles(): void {
    const apiUrl = `${this.instance.api_endpoint}/admin/settings/permissions`;
    const headers = {
      'Authorization': this.linkedToken!.access_token
    };

    console.log('Fetching platform roles from:', apiUrl);
    
    this.http.get<Role[]>(apiUrl, { headers }).subscribe({
      next: (response) => {
        console.log('Platform Roles Response:', response);
        this.roles = response;
      },
      error: (error) => {
        console.error('Error fetching platform roles:', error);
      }
    });
  }

  private loadCachedAffiliates(): void {
    console.log('Loading affiliates from management-api DB...');
    
    this.affiliateSync.loadFromCache(this.instanceId).subscribe({
      next: (result) => {
        if (result.success && result.affiliates.length > 0) {
          console.log('Loaded affiliates from cache:', result.affiliates);
          this.affiliates = result.affiliates;
          this.lastAffiliatesSyncWasForced = false;
        } else {
          // No data in DB, fetch from instance API and save
          console.log('No cached affiliates found, fetching from instance API...');
          this.syncAffiliates();
        }
      },
      error: (error) => {
        console.error('Error loading affiliates from DB:', error);
        // If DB fails, try fetching from instance API
        this.syncAffiliates();
      }
    });
  }

  private loadCachedBrands(): void {
    console.log('Loading brands from management-api DB...');
    
    this.brandSync.loadFromCache(this.instanceId).subscribe({
      next: (result) => {
        if (result.success && result.brands.length > 0) {
          console.log('Loaded brands from cache:', result.brands);
          this.brands = result.brands;
          this.lastBrandsSyncWasForced = false;
        } else {
          // No data in DB, fetch from instance API and save
          console.log('No cached brands found, fetching from instance API...');
          this.syncBrands();
        }
      },
      error: (error) => {
        console.error('Error loading brands from DB:', error);
        // If DB fails, try fetching from instance API
        this.syncBrands();
      }
    });
  }

  private loadCachedLandingPages(): void {
    console.log('Loading landing pages from management-api DB...');
    
    this.landingPageSync.loadFromCache(this.instanceId).subscribe({
      next: (result) => {
        if (result.success && (result.textLinks.length > 0 || result.geoGroups.length > 0)) {
          console.log('Loaded landing pages from cache:', { textLinks: result.textLinks.length, geoGroups: result.geoGroups.length });
          this.textLinks = result.textLinks;
          this.geoGroups = result.geoGroups;
          this.lastLandingPagesSyncWasForced = false;
        } else {
          // No data in DB, fetch from instance API and save
          console.log('No cached landing pages found, fetching from instance API...');
          this.syncLandingPages();
        }
      },
      error: (error) => {
        console.error('Error loading landing pages from DB:', error);
        // If DB fails, try fetching from instance API
        this.syncLandingPages();
      }
    });
  }

  public syncAffiliates(): void {
    if (!this.linkedToken) {
      this.toast.warning('Please connect a platform administrator account first', 'Account Required');
      return;
    }

    this.syncing = true;
    this.lastAffiliatesSyncWasForced = false;
    console.log('Syncing affiliates from instance API...');
    
    this.affiliateSync.sync(this.instanceId, this.instance.api_endpoint, this.linkedToken.access_token).subscribe({
      next: (result) => {
        this.syncing = false;
        
        if (result.success) {
          console.log('Successfully synced affiliates:', result);
          this.affiliates = result.affiliates;
          this.toast.success('Affiliates synced successfully', 'Success');
        } else {
          console.error('Sync failed:', result.error);
          this.toast.error(result.error || 'Failed to sync affiliates', 'Error');
        }
      },
      error: (error) => {
        console.error('Error syncing affiliates:', error);
        this.syncing = false;
        this.toast.error('Failed to sync affiliates', 'Error');
      }
    });
  }

  public forceSyncAffiliates(): void {
    if (!this.linkedToken) {
      this.toast.warning('Please connect a platform administrator account first', 'Account Required');
      return;
    }

    this.syncing = true;
    this.lastAffiliatesSyncWasForced = true;
    console.log('Force syncing affiliates from instance API (will soft-delete old and create new entries)...');
    
    this.affiliateSync.forceSync(this.instanceId, this.instance.api_endpoint, this.linkedToken.access_token).subscribe({
      next: (result) => {
        this.syncing = false;
        
        if (result.success) {
          console.log('Successfully force synced affiliates:', result);
          this.affiliates = result.affiliates;
          const count = result.inserted || result.affiliates.length;
          this.toast.success(`Force synced: ${count} new ${count === 1 ? 'entry' : 'entries'} created`, 'Success');
        } else {
          console.error('Force sync failed:', result.error);
          this.toast.error(result.error || 'Failed to force sync affiliates', 'Error');
        }
      },
      error: (error) => {
        console.error('Error force syncing affiliates:', error);
        this.syncing = false;
        this.toast.error('Failed to force sync affiliates', 'Error');
      }
    });
  }

  public syncBrands(): void {
    if (!this.linkedToken) {
      this.toast.warning('Please connect a platform administrator account first', 'Account Required');
      return;
    }

    this.syncing = true;
    this.lastBrandsSyncWasForced = false;
    console.log('Syncing brands from instance API...');
    
    this.brandSync.sync(this.instanceId, this.instance.api_endpoint, this.linkedToken.access_token).subscribe({
      next: (result) => {
        this.syncing = false;
        
        if (result.success) {
          console.log('[ManageInstance] Successfully synced brands:', result);
          this.brands = result.brands;
          this.toast.success(`Synced ${result.brands.length} brands`, 'Success');
        } else {
          console.error('[ManageInstance] Sync failed:', result.error);
          this.toast.error(result.error || 'Failed to fetch brands', 'Error');
        }
      },
      error: (error) => {
        console.error('[ManageInstance] Error syncing brands:', error);
        this.syncing = false;
        this.toast.error('Failed to fetch brands', 'Error');
      }
    });
  }

  public forceSyncBrands(): void {
    if (!this.linkedToken) {
      this.toast.warning('Please connect a platform administrator account first', 'Account Required');
      return;
    }

    this.syncing = true;
    this.lastBrandsSyncWasForced = true;
    console.log('Force syncing brands from instance API...');
    
    this.brandSync.forceSync(this.instanceId, this.instance.api_endpoint, this.linkedToken.access_token).subscribe({
      next: (result) => {
        this.syncing = false;
        
        if (result.success) {
          console.log('[ManageInstance] Successfully force synced brands:', result);
          this.brands = result.brands;
          this.toast.success(`Force synced ${result.brands.length} brands`, 'Success');
        } else {
          console.error('[ManageInstance] Force sync failed:', result.error);
          this.toast.error(result.error || 'Failed to force fetch brands', 'Error');
        }
      },
      error: (error) => {
        console.error('[ManageInstance] Error force syncing brands:', error);
        this.syncing = false;
        this.toast.error('Failed to force fetch brands', 'Error');
      }
    });
  }

  public syncLandingPages(): void {
    if (!this.linkedToken) {
      this.toast.warning('Please connect a platform administrator account first', 'Account Required');
      return;
    }

    this.syncing = true;
    this.lastLandingPagesSyncWasForced = false;
    console.log('Syncing landing pages from instance API...');
    
    this.landingPageSync.sync(this.instanceId, this.instance.api_endpoint, this.linkedToken.access_token, false).subscribe({
      next: (result) => {
        this.syncing = false;
        
        if (result.success) {
          console.log('[ManageInstance] Successfully synced landing pages:', result);
          this.textLinks = result.textLinks;
          this.geoGroups = result.geoGroups;
          this.toast.success(`Synced ${result.textLinks.length} text links and ${result.geoGroups.length} geo groups`, 'Success');
        } else {
          console.error('[ManageInstance] Sync failed:', result.error);
          this.toast.error(result.error || 'Failed to sync landing pages', 'Error');
        }
      },
      error: (error) => {
        console.error('[ManageInstance] Error syncing landing pages:', error);
        this.syncing = false;
        this.toast.error('Failed to sync landing pages', 'Error');
      }
    });
  }

  public forceSyncLandingPages(): void {
    if (!this.linkedToken) {
      this.toast.warning('Please connect a platform administrator account first', 'Account Required');
      return;
    }

    this.syncing = true;
    this.lastLandingPagesSyncWasForced = true;
    console.log('Force syncing landing pages from instance API...');
    
    this.landingPageSync.forceSync(this.instanceId, this.instance.api_endpoint, this.linkedToken.access_token).subscribe({
      next: (result) => {
        this.syncing = false;
        
        if (result.success) {
          console.log('[ManageInstance] Successfully force synced landing pages:', result);
          this.textLinks = result.textLinks;
          this.geoGroups = result.geoGroups;
          this.toast.success(`Force synced ${result.textLinks.length} text links and ${result.geoGroups.length} geo groups`, 'Success');
        } else {
          console.error('[ManageInstance] Force sync failed:', result.error);
          this.toast.error(result.error || 'Failed to force sync landing pages', 'Error');
        }
      },
      error: (error) => {
        console.error('[ManageInstance] Error force syncing landing pages:', error);
        this.syncing = false;
        this.toast.error('Failed to force sync landing pages', 'Error');
      }
    });
  }
}
