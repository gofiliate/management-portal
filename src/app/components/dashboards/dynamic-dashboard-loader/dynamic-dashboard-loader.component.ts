import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard.component';
import { AffiliateDashboardComponent } from '../affiliate-dashboard/affiliate-dashboard.component';
import { GroupAdminDashboardComponent } from '../group-admin-dashboard/group-admin-dashboard.component';
import { GofiliateService } from '../../../services/gofiliate.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dynamic-dashboard-loader',
  standalone: true,
  imports: [
    CommonModule,
    AdminDashboardComponent,
    AffiliateDashboardComponent,
    GroupAdminDashboardComponent
  ],
  template: `
    <ng-container *ngIf="mode && dashboardId">
      <ng-container [ngSwitch]="mode">
        <app-admin-dashboard *ngSwitchCase="'admin'" [dashboardId]="dashboardId"></app-admin-dashboard>
        <app-affiliate-dashboard *ngSwitchCase="'affiliate'" [dashboardId]="dashboardId"></app-affiliate-dashboard>
        <app-group-admin-dashboard *ngSwitchCase="'group-admin'" [dashboardId]="dashboardId"></app-group-admin-dashboard>
        <p *ngSwitchDefault>Unknown dashboard type: {{ mode }}</p>
      </ng-container>
    </ng-container>
    <p *ngIf="!mode && isLoading">Loading dashboard...</p>
    <p *ngIf="!mode && !isLoading && error">{{ error }}</p>
  `
})
export class DynamicDashboardLoaderComponent implements OnInit {
  mode: string | null = null;
  dashboardId: number | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private gofiliateService: GofiliateService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUserDashboard();
  }

  private loadUserDashboard(): void {
    const userId = this.authService.getUserId();
    
    if (!userId) {
      this.error = 'User not authenticated';
      this.isLoading = false;
      return;
    }

    // Get user's default dashboard for location_id = 1 (main dashboard)
    this.gofiliateService.getUserDashboards(userId, 1).subscribe({
      next: (response) => {
        console.log('User dashboards response:', response);
        
        // Find the default dashboard
        const defaultDashboard = response.find((d: any) => d.is_default === 1);
        
        if (defaultDashboard) {
          // Store dashboard_id and map dashboard_type to component mode
          this.dashboardId = defaultDashboard.dashboard_id;
          this.mode = this.mapDashboardTypeToMode(defaultDashboard.dashboard_type);
          console.log('Loaded dashboard:', defaultDashboard.dashboard_id, 'type:', defaultDashboard.dashboard_type, '-> mode:', this.mode);
        } else if (response.length > 0) {
          // If no default, use the first one
          this.dashboardId = response[0].dashboard_id;
          this.mode = this.mapDashboardTypeToMode(response[0].dashboard_type);
          console.log('No default dashboard, using first:', response[0].dashboard_id, 'type:', response[0].dashboard_type, '-> mode:', this.mode);
        } else {
          // No dashboards assigned
          this.error = 'No dashboard assigned to this user. Please contact your administrator.';
          console.warn('No dashboards found for user', userId);
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading user dashboards:', err);
        this.error = 'Failed to load dashboard. Please try refreshing the page.';
        this.isLoading = false;
      }
    });
  }

  private mapDashboardTypeToMode(dashboardType: string): string {
    // Map database dashboard_type to component mode
    switch (dashboardType) {
      case 'management-portal':
        return 'admin';
      case 'admin-portal':
        return 'group-admin';
      case 'affiliate-portal':
        return 'affiliate';
      default:
        console.warn('Unknown dashboard type:', dashboardType);
        return 'admin'; // Default fallback
    }
  }
}
