import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboards-widgets',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboards-widgets.component.html',
  styleUrl: './dashboards-widgets.component.scss'
})
export class DashboardsWidgetsComponent {

  constructor(private router: Router) {}

  navigateToTemplates(): void {
    this.router.navigate(['/gofiliate/dashboards-widgets/templates']);
  }

  navigateToWidgets(): void {
    this.router.navigate(['/gofiliate/dashboards-widgets/widgets']);
  }
}
