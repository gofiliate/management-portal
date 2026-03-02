import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard.component';
import { AffiliateDashboardComponent } from '../affiliate-dashboard/affiliate-dashboard.component';
import { GroupAdminDashboardComponent } from '../group-admin-dashboard/group-admin-dashboard.component';
import { ModeService } from '../../../services/mode.service';

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
    <ng-container *ngIf="mode">
      <ng-container [ngSwitch]="mode">
        <app-admin-dashboard *ngSwitchCase="'admin'"></app-admin-dashboard>
        <app-affiliate-dashboard *ngSwitchCase="'affiliate'"></app-affiliate-dashboard>
        <app-group-admin-dashboard *ngSwitchCase="'group-admin'"></app-group-admin-dashboard>
        <p *ngSwitchDefault>Unknown mode: {{ mode }}</p>
      </ng-container>
    </ng-container>
    <p *ngIf="!mode">Loading dashboard...</p>
  `
})
export class DynamicDashboardLoaderComponent implements OnInit {
  mode: string | null = null;

  constructor(private modeService: ModeService) {}

  ngOnInit(): void {
    this.mode = this.modeService.getMode();
    console.log('DynamicDashboardLoaderComponent mode:', this.mode);
  }
}
