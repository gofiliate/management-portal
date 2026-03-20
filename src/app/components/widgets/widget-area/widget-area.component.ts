import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GofiliateService } from '../../../services/gofiliate.service';
import { DynamicWidgetComponent } from '../dynamic-widget/dynamic-widget.component';

@Component({
  selector: 'app-widget-area',
  standalone: true,
  imports: [CommonModule, DynamicWidgetComponent],
  templateUrl: './widget-area.component.html',
  styleUrl: './widget-area.component.scss'
})
export class WidgetAreaComponent implements OnInit {
  @Input() dashboardId!: number;

  dashboardLayout: any = null;
  isLoading = true;
  error: string | null = null;

  constructor(private gofiliateService: GofiliateService) {}

  ngOnInit(): void {
    if (!this.dashboardId) {
      this.error = 'No dashboard ID provided';
      this.isLoading = false;
      return;
    }

    this.loadDashboardLayout();
  }

  private loadDashboardLayout(): void {
    this.gofiliateService.getDashboardLayout(this.dashboardId).subscribe({
      next: (response) => {
        console.log('Dashboard layout loaded:', response);
        this.dashboardLayout = response.layout;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard layout:', err);
        this.error = 'Failed to load dashboard. Please try refreshing the page.';
        this.isLoading = false;
      }
    });
  }

  getColClass(colWidth: number): string {
    return `col-${colWidth}`;
  }
}
