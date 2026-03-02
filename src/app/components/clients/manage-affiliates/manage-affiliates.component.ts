import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AffiliateSyncService } from '../../../services/sync/affiliate-sync.service';
import { ApiService } from '../../../services/api/api.service';
import { ToastrService } from 'ngx-toastr';

interface Affiliate {
  user_id: number;
  username: string;
  join_date?: string;
  country?: string;
  status: string;
  admin_id?: number;
  admin_username?: string;
  email?: string;
  company?: string;
  manager_id?: number;
  affiliate_username?: string;
  affiliate_status?: string;
  affiliate_unsecure_token?: string;
  last_synced?: string;
  created?: string;
  [key: string]: any;
}

interface Manager {
  user_id: number;
  account_username: string;
  account_email?: string;
  account_role_id: number;
  account_role_label: string;
}

@Component({
  selector: 'app-manage-affiliates',
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
                <i class="fa fa-users me-2"></i>
                Manage Affiliates
              </h3>
              <p class="text-muted mb-0">
                View and manage affiliate accounts for Instance #{{ instanceId }}
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
      <div class="row mb-4" *ngIf="affiliates.length > 0">
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="mb-0 fw-bold text-white">Total Affiliates</h6>
                  <h2 class="mb-0 text-white">{{ affiliates.length }}</h2>
                </div>
                <i class="fa fa-users fa-2x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="mb-0 fw-bold text-white">Active Affiliates</h6>
                  <h2 class="mb-0 text-white">{{ activeAffiliates }}</h2>
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
                  <h6 class="mb-0 fw-bold text-white">Inactive Affiliates</h6>
                  <h2 class="mb-0 text-white">{{ inactiveAffiliates }}</h2>
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

      <!-- Loading State -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Loading affiliates...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && affiliates.length === 0" class="text-center py-5">
        <i class="fa fa-users fa-4x text-muted mb-3"></i>
        <h4 class="text-muted">No Affiliates Found</h4>
        <p class="text-muted">
          No affiliate accounts are currently synced for this instance.
        </p>
        <button class="btn btn-primary mt-2" [routerLink]="['/clients/manage-instance', instanceId]">
          <i class="fa fa-arrow-left me-1"></i>
          Return to Instance Management
        </button>
      </div>

      <!-- Affiliates Table -->
      <div class="row" *ngIf="!loading && affiliates.length > 0">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <div class="row align-items-center">
                <div class="col-md-6">
                  <h5 class="mb-0">
                    <i class="fa fa-table me-2"></i>
                    Affiliate Accounts
                  </h5>
                </div>
                <div class="col-md-6">
                  <div class="d-flex justify-content-end align-items-center gap-2">
                    <input 
                      type="text" 
                      class="form-control form-control-sm" 
                      placeholder="Search affiliates..." 
                      [(ngModel)]="searchTerm"
                      (ngModelChange)="onSearchChange()"
                      style="max-width: 300px;"
                    >
                    <span class="badge bg-primary text-white">{{ totalFiltered }} / {{ affiliates.length }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th class="sortable" (click)="sortBy('user_id')" style="cursor: pointer;">
                        User ID <i class="fa" [ngClass]="getSortIcon('user_id')"></i>
                      </th>
                      <th class="sortable" (click)="sortBy('username')" style="cursor: pointer;">
                        Username <i class="fa" [ngClass]="getSortIcon('username')"></i>
                      </th>
                      <th class="sortable" (click)="sortBy('manager')" style="cursor: pointer;">
                        Account Manager <i class="fa" [ngClass]="getSortIcon('manager')"></i>
                      </th>
                      <th class="sortable" (click)="sortBy('status')" style="cursor: pointer;">
                        Status <i class="fa" [ngClass]="getSortIcon('status')"></i>
                      </th>
                      <th class="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let affiliate of paginatedAffiliates">
                      <td>
                        <code>{{ affiliate.user_id }}</code>
                      </td>
                      <td>
                        <a 
                          *ngIf="affiliate.affiliate_unsecure_token" 
                          [routerLink]="['/clients/affiliate-dashboard', affiliate.affiliate_unsecure_token]"
                          class="fw-bold text-primary"
                          style="cursor: pointer;"
                        >
                          {{ affiliate.username || affiliate.affiliate_username }}
                        </a>
                        <strong *ngIf="!affiliate.affiliate_unsecure_token">
                          {{ affiliate.username || affiliate.affiliate_username }}
                        </strong>
                      </td>
                      <td>
                        <span *ngIf="affiliate.admin_username || affiliate.manager_id">
                          <i class="fa fa-user-tie me-1 text-muted"></i>
                          {{ affiliate.admin_username || getManagerName(affiliate.manager_id) }}
                        </span>
                        <span *ngIf="!affiliate.admin_username && !affiliate.manager_id" class="text-muted">
                          No Manager
                        </span>
                      </td>
                      <td>
                        <span 
                          [class]="getStatusClass(affiliate.status || affiliate.affiliate_status)"
                        >
                          {{ getStatusLabel(affiliate.status || affiliate.affiliate_status) }}
                        </span>
                      </td>
                      <td class="text-end">
                        <div class="btn-group" role="group">
                          <button 
                            class="btn btn-sm btn-outline-primary"
                            (click)="viewAffiliateDetails(affiliate)"
                            title="View Details"
                          >
                            <i class="fa fa-eye"></i>
                          </button>
                          <button 
                            class="btn btn-sm btn-outline-warning"
                            (click)="editAffiliate(affiliate)"
                            title="Edit Affiliate"
                          >
                            <i class="fa fa-edit"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Pagination Controls -->
              <div class="card-footer">
                <div class="row align-items-center">
                  <div class="col-md-4">
                    <div class="d-flex align-items-center gap-2">
                      <label class="mb-0 small">Show:</label>
                      <select 
                        class="form-select form-select-sm" 
                        [(ngModel)]="pageSize"
                        (ngModelChange)="onPageSizeChange()"
                        style="width: auto;"
                      >
                        <option *ngFor="let size of pageSizeOptions" [value]="size">{{ size }}</option>
                      </select>
                      <span class="small text-muted">
                        Showing {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, totalFiltered) }} of {{ totalFiltered }}
                      </span>
                    </div>
                  </div>
                  <div class="col-md-8">
                    <nav aria-label="Affiliate pagination">
                      <ul class="pagination pagination-sm justify-content-end mb-0">
                        <li class="page-item" [class.disabled]="currentPage === 1">
                          <a class="page-link" (click)="previousPage()" style="cursor: pointer;">
                            <i class="fa fa-chevron-left"></i>
                          </a>
                        </li>
                        <li 
                          *ngFor="let page of pageNumbers" 
                          class="page-item" 
                          [class.active]="page === currentPage"
                        >
                          <a class="page-link" (click)="goToPage(page)" style="cursor: pointer;">{{ page }}</a>
                        </li>
                        <li class="page-item" [class.disabled]="currentPage === totalPages">
                          <a class="page-link" (click)="nextPage()" style="cursor: pointer;">
                            <i class="fa fa-chevron-right"></i>
                          </a>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Affiliate Details/Edit Modal -->
    <div class="modal" [class.show]="showModal" [style.display]="showModal ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i [class]="modalMode === 'view' ? 'fa fa-eye me-2' : 'fa fa-edit me-2'"></i>
              {{ modalMode === 'view' ? 'View' : 'Edit' }} Affiliate: {{ editingAffiliate?.username || editingAffiliate?.affiliate_username }}
            </h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          <div class="modal-body" *ngIf="editingAffiliate">
            <form>
              <!-- User ID (Read-only) -->
              <div class="row mb-3">
                <label class="col-sm-3 col-form-label">User ID</label>
                <div class="col-sm-9">
                  <input type="text" class="form-control" [value]="editingAffiliate.user_id" readonly>
                </div>
              </div>

              <!-- Username (Read-only) -->
              <div class="row mb-3">
                <label class="col-sm-3 col-form-label">Username</label>
                <div class="col-sm-9">
                  <input 
                    type="text" 
                    class="form-control" 
                    [value]="editingAffiliate.username || editingAffiliate.affiliate_username"
                    readonly
                  >
                </div>
              </div>

              <!-- Account Manager -->
              <div class="row mb-3">
                <label class="col-sm-3 col-form-label">Account Manager</label>
                <div class="col-sm-9">
                  <input 
                    type="text" 
                    class="form-control" 
                    [value]="editingAffiliate.admin_username || getManagerName(editingAffiliate.manager_id) || 'No Manager'"
                    readonly
                  >
                </div>
              </div>

              <!-- Status (Read-only) -->
              <div class="row mb-3">
                <label class="col-sm-3 col-form-label">Status</label>
                <div class="col-sm-9">
                  <input 
                    type="text" 
                    class="form-control" 
                    [value]="getStatusLabel(editingAffiliate.status || editingAffiliate.affiliate_status)"
                    readonly
                  >
                </div>
              </div>

              <!-- Last Synced (Read-only) -->
              <div class="row mb-3" *ngIf="editingAffiliate.last_synced">
                <label class="col-sm-3 col-form-label">Last Synced</label>
                <div class="col-sm-9">
                  <input type="text" class="form-control" [value]="formatDate(editingAffiliate.last_synced)" readonly>
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
              (click)="saveAffiliate()"
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

    .sortable {
      user-select: none;
    }

    .sortable:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }

    th i.fa {
      font-size: 0.8rem;
      opacity: 0.5;
    }

    .card-footer {
      background-color: #f8f9fa;
      border-top: 1px solid #dee2e6;
      padding: 0.75rem 1rem;
    }

    .pagination {
      margin: 0;
    }

    .page-link {
      color: #0d6efd;
    }

    .page-link:hover {
      color: #0a58ca;
    }

    .page-item.active .page-link {
      background-color: #0d6efd;
      border-color: #0d6efd;
    }
  `]
})
export class ManageAffiliatesComponent implements OnInit {
  Math = Math; // Expose Math to template
  instanceId: number = 0;
  affiliates: Affiliate[] = [];
  managers: Manager[] = [];
  instanceData: any = null;
  linkedToken: any = null;
  loading: boolean = true;
  showModal: boolean = false;
  modalMode: 'view' | 'edit' = 'view';
  editingAffiliate: Affiliate | null = null;
  originalAffiliate: Affiliate | null = null;
  saving: boolean = false;
  searchTerm: string = '';
  sortColumn: string = 'user_id';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage: number = 1;
  pageSize: number = 25;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  private readonly STORAGE_KEY = 'linked_tokens';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private affiliateSync: AffiliateSyncService,
    private api: ApiService,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.instanceId = parseInt(params['id'], 10);
      this.loadInstanceData();
      this.loadLinkedToken();
      this.loadAffiliates();
      this.loadManagers();
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
        this.instanceData = Array.isArray(result) ? result[0] : result;
        
        if (!this.instanceData) {
          console.error('[ManageAffiliates] Instance data is null or undefined');
          this.toast.warning('Instance data could not be loaded', 'Warning');
          return;
        }
        
        if (!this.instanceData.api_endpoint) {
          console.warn('[ManageAffiliates] Instance API endpoint is not set');
          this.toast.warning('Instance API endpoint is not configured.', 'Warning');
        }
      },
      error: (error) => {
        console.error('[ManageAffiliates] Error loading instance data:', error);
        this.toast.error('Failed to load instance data', 'Error');
      }
    });
  }

  loadAffiliates(): void {
    this.loading = true;
    this.affiliateSync.loadFromCache(this.instanceId).subscribe({
      next: (result) => {
        this.loading = false;
        if (result.success) {
          this.affiliates = result.affiliates;
        } else {
          this.toast.error(result.error || 'Failed to load affiliates', 'Error');
        }
      },
      error: (error) => {
        console.error('[ManageAffiliates] Error loading affiliates:', error);
        this.loading = false;
        this.toast.error('Failed to load affiliates', 'Error');
      }
    });
  }

  loadManagers(): void {
    // Load user accounts (including managers/admins)
    this.api.get(`/clients/instance/user-accounts/${this.instanceId}`, false).subscribe({
      next: (result: any) => {
        // Result is an array of user accounts
        this.managers = Array.isArray(result) ? result : [];
      },
      error: (error) => {
        console.error('[ManageAffiliates] Error loading user accounts:', error);
      }
    });
  }

  refresh(): void {
    this.loadAffiliates();
  }

  get filteredAndSortedAffiliates(): Affiliate[] {
    let filtered = [...this.affiliates];

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a => {
        const username = (a.username || a.affiliate_username || '').toLowerCase();
        const userId = String(a.user_id).toLowerCase();
        const manager = (a.admin_username || this.getManagerName(a.manager_id) || '').toLowerCase();
        const status = this.getStatusLabel(a.status || a.affiliate_status).toLowerCase();
        
        return username.includes(term) || userId.includes(term) || 
               manager.includes(term) || status.includes(term);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'user_id':
          aValue = a.user_id;
          bValue = b.user_id;
          break;
        case 'username':
          aValue = (a.username || a.affiliate_username || '').toLowerCase();
          bValue = (b.username || b.affiliate_username || '').toLowerCase();
          break;
        case 'manager':
          aValue = (a.admin_username || this.getManagerName(a.manager_id) || '').toLowerCase();
          bValue = (b.admin_username || this.getManagerName(b.manager_id) || '').toLowerCase();
          break;
        case 'status':
          aValue = this.getStatusLabel(a.status || a.affiliate_status).toLowerCase();
          bValue = this.getStatusLabel(b.status || b.affiliate_status).toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }

  get paginatedAffiliates(): Affiliate[] {
    const filtered = this.filteredAndSortedAffiliates;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return filtered.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAndSortedAffiliates.length / this.pageSize);
  }

  get totalFiltered(): number {
    return this.filteredAndSortedAffiliates.length;
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    
    // Show first page
    pages.push(1);
    
    // Show pages around current
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    
    // Show last page
    if (total > 1) {
      pages.push(total);
    }
    
    // Remove duplicates and sort
    return [...new Set(pages)].sort((a, b) => a - b);
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1; // Reset to first page when sorting
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return 'fa-sort';
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  onSearchChange(): void {
    this.currentPage = 1; // Reset to first page when searching
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1; // Reset to first page when changing page size
  }

  get activeAffiliates(): number {
    return this.affiliates.filter(a => {
      const status = String(a.status || a.affiliate_status || '').toLowerCase();
      return status === 'active' || status === '1';
    }).length;
  }

  get inactiveAffiliates(): number {
    return this.affiliates.filter(a => {
      const status = String(a.status || a.affiliate_status || '').toLowerCase();
      return status !== 'active' && status !== '1';
    }).length;
  }

  get lastSyncedDate(): string {
    if (this.affiliates.length === 0) return '';
    const affiliate = this.affiliates[0];
    if (affiliate.last_synced) {
      const date = new Date(affiliate.last_synced);
      return date.toLocaleString();
    }
    return '';
  }

  getStatusClass(status: string | number | undefined): string {
    const statusStr = String(status || '').toLowerCase();
    if (statusStr === 'active' || statusStr === '1') {
      return 'badge bg-success';
    }
    return 'badge bg-danger';
  }

  getStatusLabel(status: string | number | undefined): string {
    const statusStr = String(status || '').toLowerCase();
    if (statusStr === 'active' || statusStr === '1') {
      return 'Active';
    }
    return 'Inactive';
  }

  getManagerName(managerId?: number): string {
    if (!managerId || managerId === 0) {
      return 'No Manager';
    }
    const manager = this.managers.find(m => m.user_id === managerId);
    if (manager) {
      return manager.account_username || `Manager ${managerId}`;
    }
    return `Manager #${managerId}`;
  }

  viewAffiliateDetails(affiliate: Affiliate): void {
    this.editingAffiliate = { ...affiliate };
    this.modalMode = 'view';
    this.showModal = true;
  }

  editAffiliate(affiliate: Affiliate): void {
    this.editingAffiliate = { ...affiliate };
    this.originalAffiliate = { ...affiliate };
    this.modalMode = 'edit';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingAffiliate = null;
  }

  saveAffiliate(): void {
    if (!this.editingAffiliate || !this.originalAffiliate) return;

    this.saving = true;

    // For now, just show a coming soon message
    // In the future, this would update via the platform API
    this.toast.info('Affiliate update functionality coming soon', 'Coming Soon');
    this.saving = false;
    this.closeModal();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  }
}
