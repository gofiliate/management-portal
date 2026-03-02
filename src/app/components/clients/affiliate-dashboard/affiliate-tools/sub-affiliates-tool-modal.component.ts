import { Component, EventEmitter, Inject, Input, OnChanges, Output, PLATFORM_ID, SimpleChanges } from '@angular/core';
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
  selector: 'app-sub-affiliates-tool-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sub-affiliates-tool-modal.component.html',
  styleUrls: ['./sub-affiliates-tool-modal.component.scss']
})
export class SubAffiliatesToolModalComponent implements OnChanges {
  @Input() show = false;
  @Input() affiliateData: any = null;
  @Input() instanceApiEndpoint: string | null = null;
  @Input() instanceAffEndpoint: string | null = null;
  @Input() mode: string = 'admin';
  @Output() close = new EventEmitter<void>();

  subAffiliateEnabled = false;
  dealPercent = 0;
  dealEventId = 17;
  subAffiliateLink = '';
  subAffiliates: any[] = [];

  searchTerm = '';
  allAffiliates: any[] = [];
  filteredAffiliates: any[] = [];
  showSearchResults = false;

  dealTypes = [
    { value: 6, label: 'Revenue Share' },
    { value: 17, label: 'Revenue Share Earnings' },
    { value: 7, label: 'Total Earnings' }
  ];

  private readonly isBrowser: boolean;
  private resolvedInstanceApiEndpoint: string | null = null;
  private resolvedInstanceAffEndpoint: string | null = null;
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['affiliateData']) {
      this.generateSubAffiliateLink();
    }

    if (changes['show']?.currentValue === true) {
      this.generateSubAffiliateLink();
      this.loadAffiliatesList();
      this.loadSubAffiliateStatus();
      this.loadSubAffiliateDeal();
      this.loadExistingSubAffiliates();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  get userId(): number | null {
    const rawId = this.affiliateData?.user_id;
    const parsed = Number(rawId);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private async generateSubAffiliateLink(): Promise<void> {
    const unsecureToken = this.affiliateData?.affiliate_unsecure_token || this.affiliateData?.unsecure_token || null;

    if (!unsecureToken) {
      this.subAffiliateLink = 'Loading affiliate data...';
      return;
    }

    await this.ensureInstanceAffEndpoint();
    const affEndpoint = (this.resolvedInstanceAffEndpoint || '').trim();
    
    if (!affEndpoint) {
      this.subAffiliateLink = 'Affiliate endpoint not configured';
      return;
    }

    const cleanEndpoint = affEndpoint.replace(/\/+$/, '');
    this.subAffiliateLink = `${cleanEndpoint}/signup/refer/${unsecureToken}`;
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

  private async getFromInstance(route: string): Promise<any> {
    await this.ensureInstanceApiEndpoint();

    const endpoint = this.buildInstanceRoute(route);
    if (!endpoint) {
      throw new Error('Instance API endpoint is not configured');
    }

    const headers = await this.getAuthHeaders();
    return await firstValueFrom(this.http.get<any>(endpoint, { headers }));
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

  private async ensureInstanceAffEndpoint(): Promise<void> {
    if (this.resolvedInstanceAffEndpoint) {
      return;
    }

    const fromInput = (this.instanceAffEndpoint || '').trim();
    if (fromInput) {
      this.resolvedInstanceAffEndpoint = fromInput;
      return;
    }

    const instanceId = Number(this.affiliateData?.instance_id);
    if (!Number.isFinite(instanceId) || instanceId <= 0) {
      return;
    }

    try {
      const response = await firstValueFrom(this.api.get(`/clients/instance/${instanceId}`, false));
      const affEndpoint = (response?.aff_endpoint || '').trim();
      if (affEndpoint) {
        this.resolvedInstanceAffEndpoint = affEndpoint;
      }
    } catch (error) {
      console.error('Error resolving instance affiliate endpoint:', error);
    }
  }

  async toggleSubAffiliateStatus(): Promise<void> {
    if (!this.userId) {
      return;
    }

    try {
      const response = await this.postToInstance('account/sub-affiliate-status', {
        user_id: this.userId,
        status: this.subAffiliateEnabled
      });

      if (response && response.code === 200) {
        this.toastr.success('Sub-affiliate status updated successfully!', 'Success');
      } else {
        this.toastr.error('Failed to update sub-affiliate status', 'Error');
      }
    } catch (error) {
      console.error('Error updating sub-affiliate status:', error);
      this.toastr.error('Failed to update sub-affiliate status', 'Error');
    }
  }

  async updateDeal(): Promise<void> {
    if (!this.userId) {
      return;
    }

    try {
      const response = await this.postToInstance('account/sub-affiliate-deal', {
        user_id: this.userId,
        percent: parseFloat(this.dealPercent.toString()),
        event_id: parseInt(this.dealEventId.toString(), 10)
      });

      if (response && response.code === 200) {
        this.toastr.success('Sub-affiliate deal updated successfully!', 'Success');
      } else {
        this.toastr.error('Failed to update sub-affiliate deal', 'Error');
      }
    } catch (error) {
      console.error('Error updating sub-affiliate deal:', error);
      this.toastr.error('Failed to update sub-affiliate deal', 'Error');
    }
  }

  copyLinkToClipboard(): void {
    if (!this.subAffiliateLink || !this.isBrowser || !navigator?.clipboard) {
      return;
    }

    navigator.clipboard.writeText(this.subAffiliateLink).then(() => {
      this.toastr.success('Link copied to clipboard!', 'Success');
    }).catch(() => {
      this.toastr.error('Failed to copy link', 'Error');
    });
  }

  async loadAffiliatesList(): Promise<void> {
    try {
      const instanceId = Number(this.affiliateData?.instance_id);
      if (!Number.isFinite(instanceId) || instanceId <= 0) {
        this.toastr.error('Invalid instance ID', 'Error');
        return;
      }

      const response = await firstValueFrom(this.api.get(`/clients/instance/affiliate-accounts/${instanceId}`, false));

      if (response && response.payload) {
        this.allAffiliates = response.payload;
      } else if (Array.isArray(response)) {
        this.allAffiliates = response;
      } else {
        this.allAffiliates = [];
      }
    } catch (error) {
      console.error('Error loading affiliates list:', error);
      this.toastr.error('Failed to load affiliates list', 'Error');
    }
  }

  onSearchInput(): void {
    if (this.searchTerm.length >= 2) {
      this.filterAffiliates();
      this.showSearchResults = true;
      return;
    }

    this.filteredAffiliates = [];
    this.showSearchResults = false;
  }

  onSearchFocus(): void {
    if (this.searchTerm.length >= 2) {
      this.filterAffiliates();
      this.showSearchResults = true;
    }
  }

  onSearchBlur(): void {
    setTimeout(() => {
      this.showSearchResults = false;
    }, 200);
  }

  private filterAffiliates(): void {
    if (!this.searchTerm || this.searchTerm.length < 2) {
      this.filteredAffiliates = [];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();

    this.filteredAffiliates = this.allAffiliates
      .filter((affiliate: any) => {
        const usernameMatch = affiliate.username && affiliate.username.toLowerCase().includes(searchLower);
        const notAlreadyLinked = !this.subAffiliates.some(subAffiliate => String(subAffiliate.user_id) === String(affiliate.user_id));
        const notSelfUser = !this.userId || String(affiliate.user_id) !== String(this.userId);
        return usernameMatch && notAlreadyLinked && notSelfUser;
      })
      .slice(0, 10);
  }

  async addAffiliate(affiliate: any): Promise<void> {
    if (!this.userId) {
      this.toastr.error('No user ID available', 'Error');
      return;
    }

    try {
      const response = await this.postToInstance('account/sub-affiliates', {
        user_id: this.userId,
        sub_id: parseInt(String(affiliate.user_id), 10),
        status: 1
      });

      if (response && response.code === 200) {
        this.toastr.success(`${affiliate.username} added as sub-affiliate!`, 'Success');

        this.subAffiliates.push({
          user_id: affiliate.user_id,
          username: affiliate.username,
          linked: new Date().toISOString().split('T')[0]
        });

        this.searchTerm = '';
        this.filteredAffiliates = [];
        this.showSearchResults = false;
      } else {
        this.toastr.error('Failed to add sub-affiliate', 'Error');
      }
    } catch (error) {
      console.error('Error adding sub-affiliate:', error);
      this.toastr.error('Failed to add sub-affiliate', 'Error');
    }
  }

  async unlinkAffiliate(subAffiliate: any): Promise<void> {
    if (!this.userId) {
      this.toastr.error('No user ID available', 'Error');
      return;
    }

    try {
      const response = await this.postToInstance('account/sub-affiliates', {
        user_id: this.userId,
        sub_id: parseInt(String(subAffiliate.user_id), 10),
        status: 0
      });

      if (response && response.code === 200) {
        this.toastr.success(`${subAffiliate.username} has been unlinked successfully!`, 'Success');

        this.subAffiliates = this.subAffiliates.filter(item => String(item.user_id) !== String(subAffiliate.user_id));

        if (this.searchTerm && this.searchTerm.length >= 2) {
          this.filterAffiliates();
        }
      } else {
        this.toastr.error('Failed to unlink sub-affiliate', 'Error');
      }
    } catch (error) {
      console.error('Error unlinking sub-affiliate:', error);
      this.toastr.error('Failed to unlink sub-affiliate', 'Error');
    }
  }

  async loadSubAffiliateStatus(): Promise<void> {
    if (!this.userId) {
      return;
    }

    try {
      const response = await this.getFromInstance(`account/sub-affiliate-status/${this.userId}`);

      if (response && response.code === 200 && response.payload) {
        this.subAffiliateEnabled = !!response.payload.status;
      }
    } catch (error) {
      console.error('Error loading sub-affiliate status:', error);
    }
  }

  async loadSubAffiliateDeal(): Promise<void> {
    if (!this.userId) {
      return;
    }

    try {
      const response = await this.getFromInstance(`account/sub-affiliate-deal/${this.userId}`);

      if (response && response.code === 200) {
        this.dealPercent = response.percent || 10;
        this.dealEventId = response.event_id || 17;
      }
    } catch (error) {
      console.error('Error loading sub-affiliate deal:', error);
    }
  }

  async loadExistingSubAffiliates(): Promise<void> {
    if (!this.userId) {
      return;
    }

    try {
      const response = await this.getFromInstance(`account/sub-affiliates/${this.userId}`);

      if (response && response.code === 200 && response.payload) {
        this.subAffiliates = Array.isArray(response.payload) ? response.payload : [];
      } else if (Array.isArray(response)) {
        this.subAffiliates = response;
      } else {
        this.subAffiliates = [];
      }
    } catch (error) {
      console.error('Error loading existing sub-affiliates:', error);
      this.subAffiliates = [];
    }
  }
}
