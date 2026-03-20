import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetAreaComponent } from '../../widgets/widget-area/widget-area.component';

@Component({
  selector: 'app-group-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    WidgetAreaComponent
  ],
  templateUrl: './group-admin-dashboard.component.html',
  styleUrl: './group-admin-dashboard.component.scss'
})
export class GroupAdminDashboardComponent {
  @Input() dashboardId!: number;
}
