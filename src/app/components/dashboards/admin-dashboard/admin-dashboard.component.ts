import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetAreaComponent } from '../../widgets/widget-area/widget-area.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, WidgetAreaComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {
  @Input() dashboardId!: number;
}
