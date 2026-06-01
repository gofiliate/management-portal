import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InstanceReportResult } from '../../../../services/comparison-report.service';
import { EventService } from '../../../../services/event.service';

interface ComparisonRow {
  rowLabel: string;
  values: Map<number, any>;
}

@Component({
  selector: 'app-comparison-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comparison-table.component.html',
  styleUrls: ['./comparison-table.component.scss']
})
export class ComparisonTableComponent implements OnChanges {
  @Input() reportResults: InstanceReportResult[] = [];
  @Input() instanceNames: Map<number, string> = new Map();
  @Input() selectedEvents: number[] = [];

  comparisonRows: ComparisonRow[] = [];
  instanceIds: number[] = [];

  constructor(private eventService: EventService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reportResults'] || changes['selectedEvents']) {
      this.processData();
    }
  }

  private processData(): void {
    if (!this.reportResults || this.reportResults.length === 0) {
      this.comparisonRows = [];
      this.instanceIds = [];
      return;
    }

    // Get instance IDs from successful results
    this.instanceIds = this.reportResults
      .filter(r => !r.error && r.data && r.data.length > 0)
      .map(r => r.instance_id);

    if (this.instanceIds.length === 0) {
      this.comparisonRows = [];
      return;
    }

    // Build comparison rows
    this.comparisonRows = this.buildComparisonRows();
  }

  private buildComparisonRows(): ComparisonRow[] {
    const rows: ComparisonRow[] = [];

    // Find the maximum number of rows across all instances
    let maxRows = 0;
    this.reportResults.forEach(result => {
      if (result.data && result.data.length > maxRows) {
        maxRows = result.data.length;
      }
    });

    // Build rows by iterating through each row index
    for (let i = 0; i < maxRows; i++) {
      const values = new Map<number, any>();
      let rowLabel = '';

      this.reportResults.forEach(result => {
        if (result.data && result.data[i]) {
          const rowData = result.data[i];
          
          // Use date or other identifying field as row label
          // API returns date as L_DATE
          if (!rowLabel && rowData.L_DATE) {
            rowLabel = rowData.L_DATE;
          } else if (!rowLabel && rowData.date) {
            rowLabel = rowData.date;
          } else if (!rowLabel && rowData.label) {
            rowLabel = rowData.label;
          } else if (!rowLabel) {
            rowLabel = `Row ${i + 1}`;
          }

          values.set(result.instance_id, rowData);
        }
      });

      rows.push({ rowLabel, values });
    }

    return rows;
  }

  getInstanceName(instanceId: number): string {
    return this.instanceNames.get(instanceId) || `Instance ${instanceId}`;
  }

  getEventValue(rowData: any, eventId: number): string {
    if (!rowData) {
      return '-';
    }

    // API returns events with L_EVENT_ prefix (e.g., L_EVENT_11)
    const labelKey = `L_EVENT_${eventId}`;
    if (rowData[labelKey] !== undefined && rowData[labelKey] !== null) {
      return this.eventService.formatValue(rowData[labelKey], labelKey);
    }

    // Fallback: try event_ prefix
    const eventKey = `event_${eventId}`;
    if (rowData[eventKey] !== undefined && rowData[eventKey] !== null) {
      return this.eventService.formatValue(rowData[eventKey], labelKey);
    }

    // Also check without underscore prefix
    if (rowData[eventId] !== undefined && rowData[eventId] !== null) {
      return this.eventService.formatValue(rowData[eventId], labelKey);
    }

    // Check if events are in a nested object
    if (rowData.events && rowData.events[eventId]) {
      return this.eventService.formatValue(rowData.events[eventId], labelKey);
    }

    return '-';
  }

  getEventName(eventId: number): string {
    return this.eventService.getEventName(eventId);
  }

  getFormattedDate(rowLabel: string): string {
    return this.eventService.parseEventDate(rowLabel);
  }



  trackByInstanceId(index: number, instanceId: number): number {
    return instanceId;
  }

  trackByRowLabel(index: number, row: ComparisonRow): string {
    return row.rowLabel;
  }
}
