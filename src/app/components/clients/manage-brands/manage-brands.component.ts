import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BrandSyncService } from '../../../services/sync/brand-sync.service';
import { ApiService } from '../../../services/api/api.service';
import { ToastrService } from 'ngx-toastr';

interface Brand {
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

interface DataProvider {
  provider_id: number;
  provider_name: string;
  provider_url: string;
  created: string;
  status: number;
}

@Component({
  selector: 'app-manage-brands',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container-fluid py-4">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h3 class="mb-1">
                <i class="fa fa-tags me-2"></i>
                Manage Brands
              </h3>
              <p class="text-muted mb-0">
                View and manage brand configurations for Instance #{{ instanceId }}
              </p>
            </div>
            <div>
              <button 
                class="btn btn-outline-secondary me-2" 
                [routerLink]="['/clients/manage-instance', instanceId]"
              >
                <i class="fa fa-arrow-left me-1"></i>
                Back to Instance
              </button>
              <button 
                class="btn btn-primary" 
                (click)="refresh()"
                [disabled]="loading"
              >
                <i [class]="loading ? 'fa fa-spinner fa-spin me-1' : 'fa fa-sync me-1'"></i>
                {{ loading ? 'Refreshing...' : 'Refresh' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row mb-4" *ngIf="brands.length > 0">
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="mb-0 fw-bold text-white">Total Brands</h6>
                  <h2 class="mb-0 text-white">{{ brands.length }}</h2>
                </div>
                <i class="fa fa-tags fa-2x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="mb-0 fw-bold text-white">Active Brands</h6>
                  <h2 class="mb-0 text-white">{{ activeBrands }}</h2>
                </div>
                <i class="fa fa-check-circle fa-2x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="mb-0 fw-bold text-white">Inactive Brands</h6>
                  <h2 class="mb-0 text-white">{{ inactiveBrands }}</h2>
                </div>
                <i class="fa fa-times-circle fa-2x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div class="flex-grow-1 me-2">
                  <h6 class="mb-0 fw-bold text-white">Last Synced</h6>
                  <h2 class="mb-0 text-white">{{ lastSyncedDate || 'Never' }}</h2>
                </div>
                <i class="fa fa-refresh fa-2x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Brands Table -->
      <div class="row">
        <div class="col">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Brand Details</h5>
            </div>
            <div class="card-body">
              <!-- Loading State -->
              <div *ngIf="loading" class="text-center py-5">
                <i class="fa fa-spinner fa-spin fa-3x text-muted mb-3"></i>
                <p class="text-muted">Loading brands...</p>
              </div>

              <!-- Empty State -->
              <div *ngIf="!loading && brands.length === 0" class="text-center py-5">
                <i class="fa fa-tags fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No Brands Found</h5>
                <p class="text-muted mb-4">
                  No brand records are available. Sync from the platform to load brands.
                </p>
                <button 
                  class="btn btn-primary" 
                  [routerLink]="['/clients/manage-instance', instanceId]"
                >
                  <i class="fa fa-arrow-left me-1"></i>
                  Back to Instance
                </button>
              </div>

              <!-- Brands Table -->
              <div *ngIf="!loading && brands.length > 0" class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Logo</th>
                      <th>Brand Name</th>
                      <th>Identifier</th>
                      <th>Provider</th>
                      <th>Base URL</th>
                      <th>Ad URL</th>
                      <th>Status</th>
                      <th class="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let brand of brands">
                      <td>
                        <span class="badge bg-secondary">{{ brand.brand_id }}</span>
                      </td>
                      <td>
                        <div *ngIf="brand.brand_logo" class="brand-logo-thumbnail">
                          <img [src]="brand.brand_logo" [alt]="brand.brand_name" class="img-thumbnail" />
                        </div>
                        <span *ngIf="!brand.brand_logo" class="text-muted small">
                          <i class="fa fa-image"></i>
                        </span>
                      </td>
                      <td>
                        <strong>{{ brand.brand_name }}</strong>
                      </td>
                      <td>
                        <code>{{ brand.brand_ident }}</code>
                      </td>
                      <td>
                        <span *ngIf="brand.provider_id" class="badge bg-info">
                          {{ getProviderName(brand.provider_id) }}
                        </span>
                        <span *ngIf="!brand.provider_id" class="text-muted small">
                          Not Set
                        </span>
                      </td>
                      <td>
                        <a [href]="brand.brand_base_url" target="_blank" class="text-decoration-none">
                          {{ truncateUrl(brand.brand_base_url) }}
                          <i class="fa fa-external-link-alt fa-xs ms-1"></i>
                        </a>
                      </td>
                      <td>
                        <a [href]="brand.brand_ad_url" target="_blank" class="text-decoration-none">
                          {{ truncateUrl(brand.brand_ad_url) }}
                          <i class="fa fa-external-link-alt fa-xs ms-1"></i>
                        </a>
                      </td>
                      <td>
                        <span 
                          [class]="brand.active === 'true' ? 'badge bg-success' : 'badge bg-danger'"
                        >
                          {{ brand.active === 'true' ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td class="text-end">
                        <div class="btn-group" role="group">
                          <button 
                            class="btn btn-sm btn-outline-primary"
                            (click)="viewBrandDetails(brand)"
                            title="View Details"
                          >
                            <i class="fa fa-eye"></i>
                          </button>
                          <button 
                            class="btn btn-sm btn-outline-warning"
                            (click)="editBrand(brand)"
                            title="Edit Brand"
                          >
                            <i class="fa fa-edit"></i>
                          </button>
                          <button 
                            class="btn btn-sm btn-outline-danger"
                            (click)="deleteBrand(brand)"
                            title="Delete Brand"
                          >
                            <i class="fa fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Brand Details/Edit Modal -->
    <div class="modal" [class.show]="showModal" [style.display]="showModal ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i [class]="modalMode === 'view' ? 'fa fa-eye me-2' : 'fa fa-edit me-2'"></i>
              {{ modalMode === 'view' ? 'View' : 'Edit' }} Brand: {{ editingBrand?.brand_name }}
            </h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          <div class="modal-body" *ngIf="editingBrand">
            <form>
              <!-- Brand ID (Read-only) -->
              <div class="row mb-3">
                <label class="col-sm-3 col-form-label">Brand ID</label>
                <div class="col-sm-9">
                  <input type="text" class="form-control" [value]="editingBrand.brand_id" readonly>
                </div>
              </div>

              <!-- Brand Name -->
              <div class="row mb-3">
                <label class="col-sm-3 col-form-label">Brand Name</label>
                <div class="col-sm-9">
                  <input 
                    type="text" 
                    class="form-control" 
                    [(ngModel)]="editingBrand.brand_name"
                    [readonly]="modalMode === 'view'"
                    name="brand_name"
                  >
                </div>
              </div>

              <!-- Brand Identifier -->
              <div class="row mb-3">
                <label class="col-sm-3 col-form-label">Identifier</label>
                <div class="col-sm-9">
                  <input 
                    type="text" 
                    class="form-control" 
                    [(ngModel)]="editingBrand.brand_ident"
                    [readonly]="modalMode === 'view'"
                    name="brand_ident"
                  >
                </div>
              </div>

              <!-- Data Provider -->
              <div class="row mb-3">
                <label class="col-sm-3 col-form-label">Data Provider</label>
                <div class="col-sm-9">
                  <select 
                    class="form-select" 
                    [(ngModel)]="editingBrand.provider_id"
                    [disabled]="modalMode === 'view'"
                    name="provider_id"
                  >
                    <option [ngValue]="null">-- Not Set --</option>
                    <option *ngFor="let provider of providers" [ngValue]="provider.provider_id">
                      {{ provider.provider_name }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Base URL -->
              <div class="row mb-3">
                <label class="col-sm-3 col-form-label">Base URL</label>
                <div class="col-sm-9">
                  <input 
                    type="url" 
                    class="form-control" 
                    [(ngModel)]="editingBrand.brand_base_url"
                    [readonly]="modalMode === 'view'"
                    name="brand_base_url"
                  >
                  <a *ngIf="editingBrand.brand_base_url" [href]="editingBrand.brand_base_url" target="_blank" class="small">
                    <i class="fa fa-external-link-alt me-1"></i>Open in new tab
                  </a>
                </div>
              </div>

              <!-- Ad URL -->
              <div class="row mb-3">
                <label class="col-sm-3 col-form-label">Ad URL</label>
                <div class="col-sm-9">
                  <input 
                    type="url" 
                    class="form-control" 
                    [(ngModel)]="editingBrand.brand_ad_url"
                    [readonly]="modalMode === 'view'"
                    name="brand_ad_url"
                  >
                  <a *ngIf="editingBrand.brand_ad_url" [href]="editingBrand.brand_ad_url" target="_blank" class="small">
                    <i class="fa fa-external-link-alt me-1"></i>Open in new tab
                  </a>
                </div>
              </div>

              <!-- Brand Logo URL -->
              <div class="row mb-3">
                <label class="col-sm-3 col-form-label">Logo URL</label>
                <div class="col-sm-9">
                  <input 
                    type="url" 
                    class="form-control" 
                    [(ngModel)]="editingBrand.brand_logo"
                    [readonly]="modalMode === 'view'"
                    name="brand_logo"
                    placeholder="https://example.com/logo.png"
                  >
                  <div *ngIf="editingBrand.brand_logo" class="mt-2">
                    <img [src]="editingBrand.brand_logo" [alt]="editingBrand.brand_name" class="img-thumbnail" style="max-width: 150px; max-height: 150px;">
                  </div>
                </div>
              </div>

              <!-- Active Status (Read-only) -->
              <div class="row mb-3">
                <label class="col-sm-3 col-form-label">Status</label>
                <div class="col-sm-9">
                  <select 
                    class="form-select" 
                    [(ngModel)]="editingBrand.active"
                    disabled
                    name="active"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <!-- Created Date (Read-only) -->
              <div class="row mb-3" *ngIf="editingBrand.created">
                <label class="col-sm-3 col-form-label">Created</label>
                <div class="col-sm-9">
                  <input type="text" class="form-control" [value]="formatDate(editingBrand.created)" readonly>
                </div>
              </div>

              <!-- Last Synced (Read-only) -->
              <div class="row mb-3" *ngIf="editingBrand.last_synced">
                <label class="col-sm-3 col-form-label">Last Synced</label>
                <div class="col-sm-9">
                  <input type="text" class="form-control" [value]="formatDate(editingBrand.last_synced)" readonly>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">
              <i class="fa fa-times me-1"></i>
              Close
            </button>
            <button 
              *ngIf="modalMode === 'edit'" 
              type="button" 
              class="btn btn-primary" 
              (click)="saveBrand()"
              [disabled]="saving"
            >
              <i [class]="saving ? 'fa fa-spinner fa-spin me-1' : 'fa fa-save me-1'"></i>
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop" [class.show]="showModal" *ngIf="showModal"></div>
  `,
  styles: [`
    .opacity-50 {
      opacity: 0.5;
    }
    
    .card {
      box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.075);
      border: none;
    }

    .table-responsive {
      max-height: 600px;
      overflow-y: auto;
    }

    code {
      background-color: #f8f9fa;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      color: #d63384;
    }

    .brand-logo-thumbnail {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-logo-thumbnail img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .modal {
      background-color: rgba(0, 0, 0, 0.5);
    }

    .modal.show {
      display: block !important;
    }

    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1040;
      width: 100vw;
      height: 100vh;
      background-color: #000;
    }

    .modal-backdrop.show {
      opacity: 0.5;
    }
  `]
})
export class ManageBrandsComponent implements OnInit {
  instanceId: number = 0;
  brands: Brand[] = [];
  providers: DataProvider[] = [];
  instanceData: any = null;
  linkedToken: any = null;
  loading: boolean = true;
  showModal: boolean = false;
  modalMode: 'view' | 'edit' = 'view';
  editingBrand: Brand | null = null;
  originalBrand: Brand | null = null;
  saving: boolean = false;
  private readonly STORAGE_KEY = 'linked_tokens';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private brandSync: BrandSyncService,
    private api: ApiService,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.instanceId = parseInt(params['id'], 10);
      this.loadInstanceData();
      this.loadLinkedToken();
      this.loadBrands();
      this.loadProviders();
    });
  }

  private loadLinkedToken(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    
    if (stored) {
      const tokens: any[] = JSON.parse(stored);
      const token = tokens.find(t => t.instance_id === this.instanceId);
      
      if (token) {
        // Check if token is expired
        const expiry = new Date(token.expiry);
        const now = new Date();
        
        if (expiry <= now) {
          this.linkedToken = null;
          this.toast.warning('Your platform authentication has expired. Please re-authenticate via Manage Instance.', 'Token Expired');
        } else {
          this.linkedToken = token;
        }
      } else {
        this.linkedToken = null;
      }
    } else {
      this.linkedToken = null;
    }
  }

  loadInstanceData(): void {
    this.api.get(`/clients/instance/${this.instanceId}`, false).subscribe({
      next: (result: any) => {
        // Handle both array and object responses
        this.instanceData = Array.isArray(result) ? result[0] : result;
        
        if (!this.instanceData) {
          console.error('[ManageBrands] Instance data is null or undefined');
          this.toast.warning('Instance data could not be loaded', 'Warning');
          return;
        }
        
        if (!this.instanceData.api_endpoint) {
          console.warn('[ManageBrands] Instance API endpoint is not set');
          this.toast.warning('Instance API endpoint is not configured. Platform field updates will not be available.', 'Warning');
        }
      },
      error: (error) => {
        console.error('[ManageBrands] Error loading instance data:', error);
        this.toast.error('Failed to load instance data', 'Error');
      }
    });
  }

  loadBrands(): void {
    this.loading = true;
    this.brandSync.loadFromCache(this.instanceId).subscribe({
      next: (result) => {
        this.loading = false;
        if (result.success) {
          this.brands = result.brands;
        } else {
          this.toast.error(result.error || 'Failed to load brands', 'Error');
        }
      },
      error: (error) => {
        console.error('[ManageBrands] Error loading brands:', error);
        this.loading = false;
        this.toast.error('Failed to load brands', 'Error');
      }
    });
  }

  loadProviders(): void {
    this.api.get('/data-providers', false).subscribe({
      next: (result: any) => {
        this.providers = result.providers || [];
      },
      error: (error) => {
        console.error('[ManageBrands] Error loading providers:', error);
        this.toast.error('Failed to load data providers', 'Error');
      }
    });
  }

  refresh(): void {
    this.loadBrands();
  }

  get activeBrands(): number {
    return this.brands.filter(b => b.active === 'true').length;
  }

  get inactiveBrands(): number {
    return this.brands.filter(b => b.active !== 'true').length;
  }

  get lastSyncedDate(): string {
    if (this.brands.length === 0) return '';
    const brand = this.brands[0];
    if (brand.last_synced) {
      const date = new Date(brand.last_synced);
      return date.toLocaleString();
    }
    return '';
  }

  truncateUrl(url: string, maxLength: number = 40): string {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  }

  getProviderName(providerId: number): string {
    const provider = this.providers.find(p => p.provider_id === providerId);
    return provider ? provider.provider_name : `Provider ${providerId}`;
  }

  viewBrandDetails(brand: Brand): void {
    this.editingBrand = { ...brand };
    this.modalMode = 'view';
    this.showModal = true;
  }

  editBrand(brand: Brand): void {
    this.editingBrand = { ...brand };
    this.originalBrand = { ...brand };
    this.modalMode = 'edit';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingBrand = null;
  }

  saveBrand(): void {
    if (!this.editingBrand || !this.originalBrand) return;

    this.saving = true;

    // Detect what changed
    const portalFieldsChanged = 
      this.editingBrand.provider_id !== this.originalBrand.provider_id ||
      this.editingBrand.brand_logo !== this.originalBrand.brand_logo;

    const platformFieldsChanged = 
      this.editingBrand.brand_name !== this.originalBrand.brand_name ||
      this.editingBrand.brand_ident !== this.originalBrand.brand_ident ||
      this.editingBrand.brand_base_url !== this.originalBrand.brand_base_url ||
      this.editingBrand.brand_ad_url !== this.originalBrand.brand_ad_url;

    // Check if we need instance API endpoint
    if (platformFieldsChanged && (!this.instanceData || !this.instanceData.api_endpoint)) {
      this.saving = false;
      this.toast.error('Instance API endpoint not available. Only portal fields (provider, logo) can be updated.', 'Error');
      console.error('[ManageBrands] Cannot update platform fields - instance data not loaded');
      return;
    }

    // Start with promise to chain operations
    let updateChain = Promise.resolve();

    // Step 1: Update portal-managed fields if changed
    if (portalFieldsChanged) {
      const portalData = {
        provider_id: this.editingBrand.provider_id,
        brand_logo: this.editingBrand.brand_logo
      };

      updateChain = updateChain.then(() => 
        this.api.post(`/clients/instance/brand/${this.instanceId}/${this.editingBrand!.brand_id}`, portalData, false).toPromise()
          .then((result: any) => {
            if (!result.success) {
              throw new Error(result.error || 'Failed to update portal fields');
            }
          })
      );
    }

    // Step 2: Update platform-managed fields via instance API if changed
    if (platformFieldsChanged) {
      // Check if linked token is available
      if (!this.linkedToken || !this.linkedToken.access_token) {
        this.saving = false;
        this.toast.error('You must authenticate with the instance platform before updating brand fields. Go to Manage Instance and click "Link to Platform".', 'Authentication Required');
        console.error('[ManageBrands] No authentication token available for instance API');
        return;
      }

      const instanceApiUrl = `${this.instanceData.api_endpoint}/admin/settings/brands`;
      const platformData = {
        method: 'edit',
        brand_id: String(this.editingBrand.brand_id),  // Convert to string as API expects
        brand_name: this.editingBrand.brand_name,
        brand_ident: this.editingBrand.brand_ident,
        brand_base_url: this.editingBrand.brand_base_url,
        brand_ad_url: this.editingBrand.brand_ad_url
      };

      const headers = { 'Authorization': this.linkedToken.access_token };

      updateChain = updateChain.then(() => 
        this.http.post<any>(instanceApiUrl, platformData, { headers }).toPromise()
          .then((result: any) => {
            if (!result.payload || !result.payload.brand_id) {
              throw new Error('Invalid response from instance API');
            }
          })
      );

      // Step 3: Sync brands after instance API update to pull fresh data
      updateChain = updateChain.then(() => {
        if (!this.linkedToken || !this.instanceData?.api_endpoint) {
          // Just reload from cache - the instance API was updated but we can't sync without token
          return Promise.resolve();
        }
        
        return this.brandSync.sync(this.instanceId, this.instanceData.api_endpoint, this.linkedToken.access_token)
          .toPromise()
          .then((syncResult: any) => {
            if (!syncResult.success) {
              throw new Error('Failed to sync brands after update');
            }
          });
      });
    }

    // Step 4: Complete the update chain
    updateChain
      .then(() => {
        this.saving = false;
        this.toast.success('Brand updated successfully', 'Success');
        this.closeModal();
        // Refresh brands list
        this.loadBrands();
      })
      .catch((error) => {
        console.error('[ManageBrands] Error updating brand:', error);
        this.saving = false;
        this.toast.error(error.message || 'Failed to update brand', 'Error');
      });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  deleteBrand(brand: Brand): void {
    if (confirm(`Are you sure you want to delete ${brand.brand_name}?`)) {
      this.toast.warning(`Delete functionality coming soon for ${brand.brand_name}`, 'Delete Brand');
      // TODO: Implement delete functionality
    }
  }
}
