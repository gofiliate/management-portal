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
  
  // Track which widgets have data - structure: { rowIndex: { widgetIndex: hasData } }
  widgetDataStatus: Map<number, Map<number, boolean>> = new Map();
  
  // Track which widgets want to hide their row - structure: { rowIndex: { widgetIndex: shouldHideRow } }
  widgetHideRowStatus: Map<number, Map<number, boolean>> = new Map();

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
        
        // Initialize widget data status tracking
        this.dashboardLayout.rows.forEach((row: any, rowIndex: number) => {
          const widgetMap = new Map<number, boolean>();
          const hideRowMap = new Map<number, boolean>();
          row.widgets.forEach((widget: any, widgetIndex: number) => {
            // Default to true (visible) - widgets will emit false if they have no data
            widgetMap.set(widgetIndex, true);
            // Default to false (don't hide row) - widgets will emit true if they want to hide the row
            hideRowMap.set(widgetIndex, false);
          });
          this.widgetDataStatus.set(rowIndex, widgetMap);
          this.widgetHideRowStatus.set(rowIndex, hideRowMap);
        });
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard layout:', err);
        this.error = 'Failed to load dashboard. Please try refreshing the page.';
        this.isLoading = false;
      }
    });
  }

  onWidgetDataStatus(rowIndex: number, widgetIndex: number, hasData: boolean): void {
    const rowMap = this.widgetDataStatus.get(rowIndex);
    if (rowMap) {
      rowMap.set(widgetIndex, hasData);
      console.log(`Widget ${widgetIndex} in row ${rowIndex} has data: ${hasData}`);
    }
  }

  onWidgetHideRow(rowIndex: number, widgetIndex: number, shouldHideRow: boolean): void {
    const hideRowMap = this.widgetHideRowStatus.get(rowIndex);
    if (hideRowMap) {
      hideRowMap.set(widgetIndex, shouldHideRow);
      console.log(`Widget ${widgetIndex} in row ${rowIndex} wants to hide row: ${shouldHideRow}`);
    }
  }

  isRowVisible(rowIndex: number): boolean {
    // First check if any widget wants to hide the row
    const hideRowMap = this.widgetHideRowStatus.get(rowIndex);
    if (hideRowMap) {
      const anyWidgetWantsToHideRow = Array.from(hideRowMap.values()).some(hideRow => hideRow);
      if (anyWidgetWantsToHideRow) {
        console.log(`Row ${rowIndex} hidden because at least one widget requested it`);
        return false; // Hide the row if any widget wants to hide it
      }
    }
    
    // If no widget wants to hide the row, check if at least one has data
    const rowMap = this.widgetDataStatus.get(rowIndex);
    if (!rowMap) return true;
    
    // Row is visible if at least one widget has data
    const hasAnyData = Array.from(rowMap.values()).some(hasData => hasData);
    return hasAnyData;
  }

  getColClass(colWidth: number): string {
    return `col-${colWidth}`;
  }
}
