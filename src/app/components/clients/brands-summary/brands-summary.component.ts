import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Brand {
  brand_id: number;
  brand_name: string;
  brand_ident: string;
  brand_base_url: string;
  brand_ad_url: string;
  [key: string]: any;
}

@Component({
  selector: 'app-brands-summary',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Brand Summary</h5>
      </div>
      <div class="card-body">
        <!-- Brands Summary -->
        <div *ngIf="brands.length > 0; else noData">
          <h6 class="text-muted mb-3">Brand Summary</h6>
          
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">Total Brands:</span>
            <span class="badge bg-primary rounded-pill">{{ totalBrands }}</span>
          </div>
          
          <hr class="my-3">
          
          <!-- Brand List -->
          <h6 class="text-muted mb-3">Brands</h6>
          <div *ngFor="let brand of brands" class="d-flex justify-content-between mb-2">
            <span>
              <i class="fa fa-tag me-1"></i>
              {{ brand.brand_name }}
            </span>
            <span class="badge bg-secondary rounded-pill">{{ brand.brand_ident }}</span>
          </div>
          
          <hr class="my-3">
          
          <!-- Sync Buttons -->
          <div class="d-grid gap-2">
            <button 
              class="btn btn-sm btn-outline-primary" 
              (click)="onSync()"
              [disabled]="syncing"
            >
              <i [class]="syncing ? 'fa fa-spinner fa-spin me-1' : 'fa fa-sync me-1'"></i>
              {{ syncing ? 'Syncing...' : 'Sync from Platform' }}
            </button>
            
            <button 
              class="btn btn-sm btn-outline-warning" 
              (click)="onForceSync()"
              [disabled]="syncing"
            >
              <i [class]="syncing ? 'fa fa-spinner fa-spin me-1' : 'fa fa-sync-alt me-1'"></i>
              {{ syncing ? 'Force Syncing...' : 'Force Sync from Platform' }}
            </button>
            
            <button 
              class="btn btn-sm btn-outline-info" 
              [routerLink]="['/clients/manage-brands', instanceId]"
              [disabled]="syncing"
            >
              <i class="fa fa-cog me-1"></i>
              Administer Brands
            </button>
          </div>
          
          <small class="text-muted d-block mt-2">
            <i class="fa fa-info-circle me-1"></i>
            Last data source: {{ dataSourceLabel }}
          </small>
        </div>
        
        <!-- Empty State -->
        <ng-template #noData>
          <div class="text-center text-muted py-3">
            <h6 class="text-muted mb-3">Brands</h6>
            
            <div class="alert alert-info mb-3" role="alert">
              <i class="fa fa-info-circle me-2"></i>
              No brand data loaded yet. Click "Sync from Platform" to fetch brand records.
            </div>
            
            <!-- Sync Buttons -->
            <div class="d-grid gap-2">
              <button 
                class="btn btn-sm btn-primary" 
                (click)="onSync()"
                [disabled]="syncing || !hasLinkedToken"
              >
                <i [class]="syncing ? 'fa fa-spinner fa-spin me-1' : 'fa fa-sync me-1'"></i>
                {{ syncing ? 'Loading...' : 'Sync from Platform' }}
              </button>
              
              <button 
                class="btn btn-sm btn-outline-warning" 
                (click)="onForceSync()"
                [disabled]="syncing || !hasLinkedToken"
              >
                <i [class]="syncing ? 'fa fa-spinner fa-spin me-1' : 'fa fa-sync-alt me-1'"></i>
                {{ syncing ? 'Force Syncing...' : 'Force Sync from Platform' }}
              </button>
              
              <button 
                class="btn btn-sm btn-outline-info" 
                [routerLink]="['/clients/manage-brands', instanceId]"
                [disabled]="syncing"
              >
                <i class="fa fa-cog me-1"></i>
                Administer Brands
              </button>
            </div>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: []
})
export class BrandsSummaryComponent {
  
  @Input() brands: Brand[] = [];
  @Input() syncing: boolean = false;
  @Input() lastSyncWasForced: boolean = false;
  @Input() instanceId: number = 0;
  @Input() hasLinkedToken: boolean = false;

  @Output() sync = new EventEmitter<void>();
  @Output() forceSync = new EventEmitter<void>();

  get totalBrands(): number {
    return this.brands.length;
  }

  get dataSourceLabel(): string {
    if (this.lastSyncWasForced) {
      return 'Manual Sync';
    }
    return this.brands.length > 0 ? 'Cached' : 'None';
  }

  onSync(): void {
    this.sync.emit();
  }

  onForceSync(): void {
    this.forceSync.emit();
  }
}
