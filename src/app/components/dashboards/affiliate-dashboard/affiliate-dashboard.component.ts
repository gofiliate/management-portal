import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetAreaComponent } from '../../widgets/widget-area/widget-area.component';

@Component({
  selector: 'app-affiliate-dashboard',
  standalone: true,
  imports: [CommonModule, WidgetAreaComponent],
  templateUrl: './affiliate-dashboard.component.html',
  styleUrl: './affiliate-dashboard.component.scss'
})
export class AffiliateDashboardComponent {
  @Input() dashboardId!: number;
}
