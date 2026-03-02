import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AffiliateDashboardComponent } from './affiliate-dashboard/affiliate-dashboard.component';
import { GroupAdminDashboardComponent } from './group-admin-dashboard/group-admin-dashboard.component';
import { DynamicDashboardLoaderComponent } from './dynamic-dashboard-loader/dynamic-dashboard-loader.component';

@NgModule({
  imports: [
    CommonModule,
    AdminDashboardComponent,
    AffiliateDashboardComponent,
    GroupAdminDashboardComponent
  ],
  declarations: [
    DynamicDashboardLoaderComponent
  ],
  exports: [
    DynamicDashboardLoaderComponent
  ]
})
export class DashboardsModule {}
