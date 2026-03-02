import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api/api.service';
import { ToastrService } from 'ngx-toastr';
import { SubAffiliatesToolModalComponent } from './affiliate-tools/sub-affiliates-tool-modal.component';
import { ChangePasswordToolModalComponent } from './affiliate-tools/change-password-tool-modal.component';
import { TextlinksToolModalComponent } from './affiliate-tools/textlinks-tool-modal.component';

interface AffiliateData {
  instance_id: number;
  user_id: number;
  manager_id: number;
  affiliate_username: string;
  affiliate_unsecure_token: string;
  affiliate_status: string;
  created: string;
  last_synced?: string;
}

interface InstanceData {
  instance_id: number;
  instance_name: string;
  client_logo?: string;
  api_endpoint?: string;
  ad_endpoint?: string;
  aff_endpoint?: string;
  status: number;
  created: string;
  updated: string;
}

interface AffiliateDashboardResponse {
  affiliate: AffiliateData;
  instance: InstanceData;
  brands: any[];
  meta: {
    active_brand_count: number;
    total_brand_count: number;
  };
}

@Component({
  selector: 'app-affiliate-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SubAffiliatesToolModalComponent, ChangePasswordToolModalComponent, TextlinksToolModalComponent],
  template: `
    <div class="container-fluid py-4">
      <!-- Loading State -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Loading affiliate dashboard...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="!loading && error" class="alert alert-danger" role="alert">
        <i class="fa fa-exclamation-triangle me-2"></i>
        {{ error }}
      </div>

      <!-- Affiliate Dashboard Content -->
      <div *ngIf="!loading && !error && affiliateData">
        <!-- Header -->
        <div class="row mb-4">
          <div class="col">
            <div class="d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center gap-3">
                <div class="instance-logo-wrapper">
                  <img 
                    *ngIf="instanceData?.client_logo"
                    [src]="instanceData?.client_logo"
                    [alt]="(instanceData?.instance_name || 'Instance') + ' logo'"
                    class="instance-logo"
                  >
                  <div *ngIf="!instanceData?.client_logo" class="instance-logo-fallback">
                    <i class="fa fa-building"></i>
                  </div>
                </div>
                <div>
                  <h3 class="mb-1">
                    <i class="fa fa-user-circle me-2"></i>
                    {{ affiliateData.affiliate_username }}
                  </h3>
                  <p class="text-muted mb-0">
                    Affiliate Dashboard · {{ instanceData?.instance_name || 'Unknown Instance' }}
                    <span *ngIf="instanceData?.instance_id">(#{{ instanceData?.instance_id }})</span>
                  </p>
                </div>
              </div>
              <div>
                <a 
                  [routerLink]="['/clients/manage-affiliates', affiliateData.instance_id]" 
                  class="btn btn-outline-secondary"
                >
                  <i class="fa fa-arrow-left me-1"></i>
                  Back to Affiliates
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Metrics - Row 1 -->
        <div class="row mb-4">
          <div class="col-md-3 mb-3">
            <div class="card metric-card">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <p class="text-muted mb-1 small">Total Clicks</p>
                    <h4 class="mb-0">12,458</h4>
                    <small class="text-success">
                      <i class="fa fa-arrow-up me-1"></i>15.3%
                    </small>
                  </div>
                  <div class="metric-icon bg-primary-subtle">
                    <i class="fa fa-mouse-pointer text-primary"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-3">
            <div class="card metric-card">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <p class="text-muted mb-1 small">Conversions</p>
                    <h4 class="mb-0">342</h4>
                    <small class="text-success">
                      <i class="fa fa-arrow-up me-1"></i>8.2%
                    </small>
                  </div>
                  <div class="metric-icon bg-success-subtle">
                    <i class="fa fa-check-circle text-success"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-3">
            <div class="card metric-card">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <p class="text-muted mb-1 small">Revenue</p>
                    <h4 class="mb-0">$8,945</h4>
                    <small class="text-danger">
                      <i class="fa fa-arrow-down me-1"></i>2.1%
                    </small>
                  </div>
                  <div class="metric-icon bg-warning-subtle">
                    <i class="fa fa-dollar-sign text-warning"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-3">
            <div class="card metric-card">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <p class="text-muted mb-1 small">Active Players</p>
                    <h4 class="mb-0">1,245</h4>
                    <small class="text-success">
                      <i class="fa fa-arrow-up me-1"></i>12.5%
                    </small>
                  </div>
                  <div class="metric-icon bg-info-subtle">
                    <i class="fa fa-users text-info"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Metrics - Row 2 -->
        <div class="row mb-4">
          <div class="col-md-3 mb-3">
            <div class="card metric-card">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <p class="text-muted mb-1 small">Commission</p>
                    <h4 class="mb-0">$2,340</h4>
                    <small class="text-success">
                      <i class="fa fa-arrow-up me-1"></i>5.8%
                    </small>
                  </div>
                  <div class="metric-icon bg-success-subtle">
                    <i class="fa fa-coins text-success"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-3">
            <div class="card metric-card">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <p class="text-muted mb-1 small">Conversion Rate</p>
                    <h4 class="mb-0">2.74%</h4>
                    <small class="text-muted">
                      <i class="fa fa-minus me-1"></i>0.0%
                    </small>
                  </div>
                  <div class="metric-icon bg-primary-subtle">
                    <i class="fa fa-percentage text-primary"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-3">
            <div class="card metric-card">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <p class="text-muted mb-1 small">New Players</p>
                    <h4 class="mb-0">156</h4>
                    <small class="text-danger">
                      <i class="fa fa-arrow-down me-1"></i>3.2%
                    </small>
                  </div>
                  <div class="metric-icon bg-info-subtle">
                    <i class="fa fa-user-plus text-info"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-3">
            <div class="card metric-card">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <p class="text-muted mb-1 small">Avg. Deposit</p>
                    <h4 class="mb-0">$127</h4>
                    <small class="text-success">
                      <i class="fa fa-arrow-up me-1"></i>7.3%
                    </small>
                  </div>
                  <div class="metric-icon bg-warning-subtle">
                    <i class="fa fa-wallet text-warning"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Management Tools -->
        <div class="row mb-4">
          <div class="col-md-12">
            <h5 class="mb-3">
              <i class="fa fa-tools me-2"></i>
              Account Management Tools
            </h5>
          </div>
        </div>

        <div class="row">
          <!-- Change Password -->
          <div class="col-md-3 mb-3">
            <div class="card tool-card" (click)="openChangePasswordModal()">
              <div class="card-body text-center">
                <div class="tool-icon mb-3">
                  <i class="fa fa-key fa-2x"></i>
                </div>
                <h6 class="mb-0">Change Password</h6>
              </div>
            </div>
          </div>

          <!-- View Details -->
          <div class="col-md-3 mb-3">
            <div class="card tool-card" (click)="onToolClick('view-details')">
              <div class="card-body text-center">
                <div class="tool-icon mb-3">
                  <i class="fa fa-id-card fa-2x"></i>
                </div>
                <h6 class="mb-0">View Details</h6>
              </div>
            </div>
          </div>

          <!-- View Commissions -->
          <div class="col-md-3 mb-3">
            <div class="card tool-card" (click)="onToolClick('view-commissions')">
              <div class="card-body text-center">
                <div class="tool-icon mb-3">
                  <i class="fa fa-money fa-2x"></i>
                </div>
                <h6 class="mb-0">View Commissions</h6>
              </div>
            </div>
          </div>

          <!-- Sub Affiliates -->
          <div class="col-md-3 mb-3">
            <div class="card tool-card" (click)="openSubAffiliatesModal()">
              <div class="card-body text-center">
                <div class="tool-icon mb-3">
                  <i class="fa fa-users fa-2x"></i>
                </div>
                <h6 class="mb-0">Sub Affiliates</h6>
              </div>
            </div>
          </div>

          <!-- View Players -->
          <div class="col-md-3 mb-3">
            <div class="card tool-card" (click)="onToolClick('view-players')">
              <div class="card-body text-center">
                <div class="tool-icon mb-3">
                  <i class="fa fa-users fa-2x"></i>
                </div>
                <h6 class="mb-0">View Players</h6>
              </div>
            </div>
          </div>

          <!-- Postbacks -->
          <div class="col-md-3 mb-3">
            <div class="card tool-card" (click)="onToolClick('postbacks')">
              <div class="card-body text-center">
                <div class="tool-icon mb-3">
                  <i class="fa fa-bullhorn fa-2x"></i>
                </div>
                <h6 class="mb-0">Postbacks</h6>
              </div>
            </div>
          </div>

          <!-- Promo Codes -->
          <div class="col-md-3 mb-3">
            <div class="card tool-card" (click)="onToolClick('promo-codes')">
              <div class="card-body text-center">
                <div class="tool-icon mb-3">
                  <i class="fa fa-tag fa-2x"></i>
                </div>
                <h6 class="mb-0">Promo Codes</h6>
              </div>
            </div>
          </div>

          <!-- Text Links -->
          <div class="col-md-3 mb-3">
            <div class="card tool-card" (click)="openTextlinksModal()">
              <div class="card-body text-center">
                <div class="tool-icon mb-3">
                  <i class="fa fa-link fa-2x"></i>
                </div>
                <h6 class="mb-0">Text Links</h6>
              </div>
            </div>
          </div>

          <!-- Banners -->
          <div class="col-md-3 mb-3">
            <div class="card tool-card" (click)="onToolClick('banners')">
              <div class="card-body text-center">
                <div class="tool-icon mb-3">
                  <i class="fa fa-image fa-2x"></i>
                </div>
                <h6 class="mb-0">Banners</h6>
              </div>
            </div>
          </div>
        </div>
      </div>

      <app-sub-affiliates-tool-modal
        *ngIf="showSubAffiliatesModal"
        [show]="showSubAffiliatesModal"
        [affiliateData]="affiliateData"
        [instanceApiEndpoint]="instanceData?.api_endpoint || null"
        [instanceAffEndpoint]="instanceData?.aff_endpoint || null"
        [mode]="'admin'"
        (close)="closeSubAffiliatesModal()"
      ></app-sub-affiliates-tool-modal>

      <app-change-password-tool-modal
        *ngIf="showChangePasswordModal"
        [show]="showChangePasswordModal"
        [affiliateData]="affiliateData"
        [instanceApiEndpoint]="instanceData?.api_endpoint || null"
        [mode]="'admin'"
        (close)="closeChangePasswordModal()"
      ></app-change-password-tool-modal>

      <app-textlinks-tool-modal
        *ngIf="showTextlinksModal"
        [show]="showTextlinksModal"
        [affiliateData]="affiliateData"
        [instanceApiEndpoint]="instanceData?.api_endpoint || null"
        [instanceAdEndpoint]="instanceData?.ad_endpoint || null"
        [mode]="'admin'"
        (close)="closeTextlinksModal()"
      ></app-textlinks-tool-modal>
    </div>
  `,
  styles: [`
    .user-select-all {
      cursor: pointer;
    }

    .badge {
      font-size: 0.875rem;
      padding: 0.35em 0.65em;
    }

    .card {
      border: 1px solid #dee2e6;
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }

    .card-header {
      background-color: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
    }

    .metric-card {
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
    }

    .metric-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      font-size: 1.5rem;
    }

    .tool-card {
      background-color: white;
      color: black;
      border: 1px solid #dee2e6;
      cursor: pointer;
      transition: all 0.2s;
      height: 100%;
    }

    .tool-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
      border-color: #0d6efd;
    }

    .tool-card .card-body {
      padding: 2rem 1rem;
    }

    .tool-icon {
      color: #495057;
      transition: color 0.2s;
    }

    .tool-card:hover .tool-icon {
      color: #0d6efd;
    }

    .tool-card h6 {
      font-weight: 600;
      color: #212529;
    }

    .instance-logo-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #dee2e6;
      background-color: #fff;
      flex-shrink: 0;
    }

    .instance-logo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .instance-logo-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6c757d;
      font-size: 1.25rem;
      background-color: #f8f9fa;
    }

    .bg-primary-subtle {
      background-color: rgba(13, 110, 253, 0.1) !important;
    }

    .bg-success-subtle {
      background-color: rgba(25, 135, 84, 0.1) !important;
    }

    .bg-warning-subtle {
      background-color: rgba(255, 193, 7, 0.1) !important;
    }

    .bg-info-subtle {
      background-color: rgba(13, 202, 240, 0.1) !important;
    }

    .text-success {
      color: #198754 !important;
    }

    .text-danger {
      color: #dc3545 !important;
    }

    .text-warning {
      color: #ffc107 !important;
    }

    .text-info {
      color: #0dcaf0 !important;
    }

    .text-primary {
      color: #0d6efd !important;
    }
  `]
})
export class AffiliateDashboardComponent implements OnInit {
  unsecureToken: string = '';
  affiliateData: AffiliateData | null = null;
  instanceData: InstanceData | null = null;
  loading: boolean = true;
  error: string = '';
  showSubAffiliatesModal: boolean = false;
  showChangePasswordModal: boolean = false;
  showTextlinksModal: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.unsecureToken = params['uuid'];
      this.loadAffiliateByToken();
    });
  }

  loadAffiliateByToken(): void {
    this.loading = true;
    this.error = '';

    this.api.get(`/affiliates/dashboard/${this.unsecureToken}`, false).subscribe({
      next: (response: AffiliateDashboardResponse) => {
        this.affiliateData = response.affiliate;
        this.instanceData = response.instance;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading affiliate dashboard:', err);
        this.error = err?.error?.message || 'Failed to load affiliate dashboard data.';
        this.loading = false;
      }
    });
  }

  getStatusClass(): string {
    if (!this.affiliateData) return 'badge bg-secondary';
    const status = String(this.affiliateData.affiliate_status || '').toUpperCase();
    if (status === 'ALLOWED') {
      return 'badge bg-success';
    }
    if (status === 'PENDING' || status === 'NEW') {
      return 'badge bg-warning';
    }
    return 'badge bg-danger';
  }

  getStatusLabel(): string {
    if (!this.affiliateData) return 'Unknown';
    return String(this.affiliateData.affiliate_status || 'Unknown').toUpperCase();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString();
  }

  onToolClick(tool: string): void {
    if (tool === 'sub-affiliates') {
      this.openSubAffiliatesModal();
      return;
    }

    this.toast.info(`${tool} functionality coming soon`, 'Coming Soon');
  }

  openSubAffiliatesModal(): void {
    this.showSubAffiliatesModal = true;
  }

  closeSubAffiliatesModal(): void {
    this.showSubAffiliatesModal = false;
  }

  openChangePasswordModal(): void {
    this.showChangePasswordModal = true;
  }

  closeChangePasswordModal(): void {
    this.showChangePasswordModal = false;
  }

  openTextlinksModal(): void {
    this.showTextlinksModal = true;
  }

  closeTextlinksModal(): void {
    this.showTextlinksModal = false;
  }
}
