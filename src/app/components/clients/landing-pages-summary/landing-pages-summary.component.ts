import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface TextLink {
  url_item_id: number;
  url_item_description: string;
  internal_description: string;
  [key: string]: any;
}

interface GeoGroup {
  geo_id: number;
  description: string;
  internal_description: string;
  status: number;
  [key: string]: any;
}

@Component({
  selector: 'app-landing-pages-summary',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Landing Pages Summary</h5>
      </div>
      <div class="card-body">
        <!-- Landing Pages Summary -->
        <div *ngIf="hasData; else noData">
          <h6 class="text-muted mb-3">Landing Pages Summary</h6>
          
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">Total Text Links:</span>
            <span class="badge bg-primary rounded-pill">{{ totalTextLinks }}</span>
          </div>
          
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold">Total Geo Groups:</span>
            <span class="badge bg-info rounded-pill">{{ totalGeoGroups }}</span>
          </div>
          
          <hr class="my-3">
          
          <!-- Text Links List -->
          <div *ngIf="textLinks.length > 0">
            <h6 class="text-muted mb-3">Text Links (Base URLs)</h6>
            <div *ngFor="let link of textLinks.slice(0, 5)" class="d-flex justify-content-between mb-2">
              <span>
                <i class="fa fa-link me-1"></i>
                {{ link.url_item_description || link.internal_description }}
              </span>
              <span class="badge bg-secondary rounded-pill">ID: {{ link.url_item_id }}</span>
            </div>
            <div *ngIf="textLinks.length > 5" class="text-muted small">
              <i class="fa fa-info-circle me-1"></i>
              And {{ textLinks.length - 5 }} more...
            </div>
            <hr class="my-3">
          </div>
          
          <!-- Geo Groups List -->
          <div *ngIf="geoGroups.length > 0">
            <h6 class="text-muted mb-3">Geo Groups (Country Collections)</h6>
            <div *ngFor="let group of geoGroups.slice(0, 5)" class="d-flex justify-content-between mb-2">
              <span>
                <i class="fa fa-globe me-1"></i>
                {{ group.description }}
              </span>
              <span class="badge rounded-pill" [ngClass]="group.status === 1 ? 'bg-success' : 'bg-warning'">
                {{ group.status === 1 ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <div *ngIf="geoGroups.length > 5" class="text-muted small">
              <i class="fa fa-info-circle me-1"></i>
              And {{ geoGroups.length - 5 }} more...
            </div>
            <hr class="my-3">
          </div>
          
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
              [routerLink]="['/clients/manage-landing-pages', instanceId]"
              [disabled]="syncing"
            >
              <i class="fa fa-cog me-1"></i>
              Administer Landing Pages
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
            <h6 class="text-muted mb-3">Landing Pages</h6>
            
            <div class="alert alert-info mb-3" role="alert">
              <i class="fa fa-info-circle me-2"></i>
              No landing page data loaded yet. Click "Sync from Platform" to fetch text links and geo groups.
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
                [routerLink]="['/clients/manage-landing-pages', instanceId]"
                [disabled]="syncing"
              >
                <i class="fa fa-cog me-1"></i>
                Administer Landing Pages
              </button>
            </div>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: []
})
export class LandingPagesSummaryComponent {
  
  @Input() textLinks: TextLink[] = [];
  @Input() geoGroups: GeoGroup[] = [];
  @Input() syncing: boolean = false;
  @Input() lastSyncWasForced: boolean = false;
  @Input() instanceId: number = 0;
  @Input() hasLinkedToken: boolean = false;

  @Output() sync = new EventEmitter<void>();
  @Output() forceSync = new EventEmitter<void>();

  get totalTextLinks(): number {
    return this.textLinks.length;
  }

  get totalGeoGroups(): number {
    return this.geoGroups.length;
  }

  get hasData(): boolean {
    return this.textLinks.length > 0 || this.geoGroups.length > 0;
  }

  get dataSourceLabel(): string {
    if (this.lastSyncWasForced) {
      return 'Manual Sync';
    }
    return this.hasData ? 'Cached' : 'None';
  }

  onSync(): void {
    this.sync.emit();
  }

  onForceSync(): void {
    this.forceSync.emit();
  }
}
