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

interface Brand {
  brand_id: number;
  brand_name: string;
  brand_ad_url: string;
}

interface Textlink {
  link_id: number;
  brand_id: number;
  link_url: string;
  link_description: string;
  active: string;
}

interface CommissionPlan {
  commission_id: number;
  brand_id: number;
  internal_description: string;
}

interface Campaign {
  campaign_id: number;
  campaign_name: string;
}

interface AdServer {
  brand_id: number;
  brand_ad_url: string;
}

interface GeoGroup {
  geo_id: number;
  brand_id: number;
  internal_description: string;
  status: number;
}

@Component({
  selector: 'app-textlinks-tool-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './textlinks-tool-modal.component.html',
  styleUrls: ['./textlinks-tool-modal.component.scss']
})
export class TextlinksToolModalComponent implements OnChanges {
  @Input() show = false;
  @Input() affiliateData: any = null;
  @Input() instanceApiEndpoint: string | null = null;
  @Input() instanceAdEndpoint: string | null = null;
  @Input() mode: string = 'admin';
  @Output() close = new EventEmitter<void>();

  // Data arrays
  brands: Brand[] = [];
  allTextlinks: Textlink[] = [];
  allCommissions: CommissionPlan[] = [];
  campaigns: Campaign[] = [];
  adServers: AdServer[] = [];
  geoGroups: GeoGroup[] = [];

  // Filtered arrays
  filteredTextlinks: Textlink[] = [];
  filteredCommissions: CommissionPlan[] = [];

  // UI flags
  showBrandSelect: boolean = false;
  isLoading: boolean = false;
  hasLandingPages: boolean = false;

  // Form selections
  selectedBrand: number | null = null;
  selectedCommission: number | null = null;
  selectedTextlink: number | null = null;
  selectedCampaign: number | null = null;

  // Generated output
  generatedTextlink: string = '';
  showOutput: boolean = false;
  includeDynamicParams: boolean = false;

  // Geo links
  selectedGeoGroup: number | null = null;
  selectedGeoCampaign: number | null = null;
  generatedGeoLink: string = '';
  showGeoOutput: boolean = false;
  includeGeoDynamicParams: boolean = false;

  // Campaign modal
  showCampaignModal: boolean = false;
  newCampaignName: string = '';

  private readonly isBrowser: boolean;
  private resolvedInstanceApiEndpoint: string | null = null;
  private resolvedInstanceAdEndpoint: string | null = null;
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
    if (changes['show']?.currentValue === true) {
      this.loadData();
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

  get unsecureToken(): string {
    return this.affiliateData?.affiliate_unsecure_token || this.affiliateData?.unsecure_token || '';
  }

  private async loadData(): Promise<void> {
    if (!this.userId) return;

    this.isLoading = true;

    try {
      await this.ensureInstanceApiEndpoint();
      await this.ensureInstanceAdEndpoint();

      const instanceId = Number(this.affiliateData?.instance_id);
      if (!Number.isFinite(instanceId) || instanceId <= 0) {
        this.toastr.error('Invalid instance ID', 'Error');
        this.isLoading = false;
        return;
      }

      // Load all data in parallel
      const [brands, textlinks, commissions, campaigns, geoGroups] = await Promise.all([
        firstValueFrom(this.api.get(`/clients/instance/brands/${instanceId}`, false)),
        firstValueFrom(this.api.get(`/clients/instance/textlinks/${instanceId}`, false)),
        this.getFromInstance(`account/commission-list/${this.userId}`),
        this.getFromInstance(`account/campaign-list/${this.userId}`),
        firstValueFrom(this.api.get(`/clients/instance/geo-groupings/${instanceId}`, false))
      ]);

      this.brands = this.extractPayload(brands) || [];
      this.allTextlinks = this.extractPayload(textlinks) || [];
      this.allCommissions = this.extractPayload(commissions) || [];
      this.campaigns = this.extractPayload(campaigns) || [];
      this.geoGroups = this.extractPayload(geoGroups) || [];

      // Build ad servers from brands
      this.adServers = this.brands.map(brand => ({
        brand_id: brand.brand_id,
        brand_ad_url: brand.brand_ad_url || this.resolvedInstanceAdEndpoint || ''
      }));

      // Check if we have landing pages
      this.hasLandingPages = this.allTextlinks.filter(t => t.active === 'active').length > 0;

      if (this.hasLandingPages) {
        this.setupBrandLogic();
      }

      this.isLoading = false;
    } catch (error) {
      console.error('Error loading textlinks data:', error);
      this.toastr.error('Failed to load textlinks data', 'Error');
      this.isLoading = false;
    }
  }

  private extractPayload(response: any): any {
    if (response && response.payload) {
      return response.payload;
    }
    return Array.isArray(response) ? response : [];
  }

  private setupBrandLogic(): void {
    this.showBrandSelect = this.brands.length > 1;

    if (this.brands.length === 1) {
      this.selectedBrand = this.brands[0].brand_id;
      this.filterDataByBrand(this.selectedBrand);
    } else {
      this.filteredTextlinks = [];
      this.filteredCommissions = [];
    }
  }

  private filterDataByBrand(brandId: number): void {
    this.filteredTextlinks = this.allTextlinks.filter(t => 
      t.brand_id === brandId && t.active === 'active'
    );
    this.filteredCommissions = this.allCommissions.filter(c => 
      c.brand_id === brandId
    );
  }

  onBrandChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedBrand = select.value ? parseInt(select.value) : null;

    this.selectedCommission = null;
    this.selectedTextlink = null;
    this.generatedTextlink = '';
    this.showOutput = false;

    if (this.selectedBrand) {
      this.filterDataByBrand(this.selectedBrand);
    } else {
      this.filteredTextlinks = [];
      this.filteredCommissions = [];
    }
  }

  onCommissionChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedCommission = select.value ? parseInt(select.value) : null;
    this.generateLinkIfReady();
  }

  onTextlinkChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedTextlink = select.value ? parseInt(select.value) : null;
    this.generateLinkIfReady();
  }

  onCampaignChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedCampaign = select.value ? parseInt(select.value) : null;
    this.generateLinkIfReady();
  }

  private generateLinkIfReady(): void {
    const brandToUse = this.selectedBrand || (this.brands.length === 1 ? this.brands[0].brand_id : null);

    if (brandToUse && this.selectedCommission && this.selectedTextlink && this.selectedCampaign) {
      this.generateSimpleLink();
      this.showOutput = true;
    } else {
      this.generatedTextlink = '';
      this.showOutput = false;
    }
  }

  private generateSimpleLink(): void {
    if (!this.unsecureToken || !this.adServers.length) return;

    const brandToUse = this.selectedBrand || (this.brands.length === 1 ? this.brands[0].brand_id : null);
    if (!brandToUse) return;

    const adServer = this.adServers.find(server => server.brand_id === brandToUse);

    if (adServer) {
      let textlink = `${adServer.brand_ad_url}/v2/text/${this.selectedCommission}/${this.selectedTextlink}/${this.unsecureToken}/${this.selectedCampaign}`;

      if (this.includeDynamicParams) {
        textlink += '?clickid={clickid}';
      }

      this.generatedTextlink = textlink;
    }
  }

  onIncludeDynamicParamsChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.includeDynamicParams = checkbox.checked;
    this.generateLinkIfReady();
  }

  onGeoGroupChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedGeoGroup = select.value ? parseInt(select.value) : null;
    this.generateGeoLinkIfReady();
  }

  onGeoCampaignChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedGeoCampaign = select.value ? parseInt(select.value) : null;
    this.generateGeoLinkIfReady();
  }

  private generateGeoLinkIfReady(): void {
    if (this.selectedGeoGroup && this.selectedGeoCampaign) {
      this.generateGeoLink();
      this.showGeoOutput = true;
    } else {
      this.generatedGeoLink = '';
      this.showGeoOutput = false;
    }
  }

  private generateGeoLink(): void {
    if (!this.unsecureToken || !this.adServers.length) return;

    const brandId = this.selectedBrand || (this.brands.length === 1 ? this.brands[0].brand_id : null);
    if (!brandId) return;

    const adServer = this.adServers.find(server => server.brand_id === brandId);

    if (adServer) {
      let geoLink = `${adServer.brand_ad_url}/geo/${this.selectedGeoGroup}/${this.unsecureToken}/${this.selectedGeoCampaign}`;

      if (this.includeGeoDynamicParams) {
        geoLink += '?clickid={clickid}';
      }

      this.generatedGeoLink = geoLink;
    }
  }

  onIncludeGeoDynamicParamsChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.includeGeoDynamicParams = checkbox.checked;
    this.generateGeoLinkIfReady();
  }

  showAddCampaignModal(): void {
    this.showCampaignModal = true;
    this.newCampaignName = '';
  }

  hideAddCampaignModal(): void {
    this.showCampaignModal = false;
    this.newCampaignName = '';
  }

  async createCampaign(): Promise<void> {
    if (!this.newCampaignName.trim() || !this.userId) {
      this.toastr.error('Please enter a campaign name', 'Error');
      return;
    }

    try {
      const response = await this.postToInstance(`media/campaigns/${this.userId}`, {
        campaign_name: this.newCampaignName.trim()
      });

      if (response) {
        const newCampaign = this.extractPayload(response);
        this.campaigns.push(newCampaign);
        this.selectedCampaign = newCampaign.campaign_id;
        this.hideAddCampaignModal();
        this.toastr.success('Campaign created successfully', 'Success');
        this.generateLinkIfReady();
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      this.toastr.error('Failed to create campaign', 'Error');
    }
  }

  copyToClipboard(text: string): void {
    if (!this.isBrowser || !navigator?.clipboard) return;

    navigator.clipboard.writeText(text).then(() => {
      this.toastr.success('Link copied to clipboard!', 'Success');
    }).catch(() => {
      this.toastr.error('Failed to copy link', 'Error');
    });
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

  private async ensureInstanceAdEndpoint(): Promise<void> {
    if (this.resolvedInstanceAdEndpoint) {
      return;
    }

    const fromInput = (this.instanceAdEndpoint || '').trim();
    if (fromInput) {
      this.resolvedInstanceAdEndpoint = fromInput;
      return;
    }

    const instanceId = Number(this.affiliateData?.instance_id);
    if (!Number.isFinite(instanceId) || instanceId <= 0) {
      return;
    }

    try {
      const response = await firstValueFrom(this.api.get(`/clients/instance/${instanceId}`, false));
      const adEndpoint = (response?.ad_endpoint || '').trim();
      if (adEndpoint) {
        this.resolvedInstanceAdEndpoint = adEndpoint;
      }
    } catch (error) {
      console.error('Error resolving instance ad endpoint:', error);
    }
  }
}
