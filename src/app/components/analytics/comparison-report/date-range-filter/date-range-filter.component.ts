import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface DateRange {
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-date-range-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './date-range-filter.component.html',
  styleUrl: './date-range-filter.component.scss'
})
export class DateRangeFilterComponent implements OnInit {
  @Output() dateRangeChange = new EventEmitter<DateRange>();

  startDate: string = '';
  endDate: string = '';
  validationError: string = '';

  presetRanges = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: 'last7' },
    { label: 'Last 30 Days', value: 'last30' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' }
  ];

  ngOnInit() {
    // Set default to current month
    this.setPresetRange('thisMonth');
  }

  setPresetRange(preset: string) {
    const today = new Date();
    let start: Date;
    let end: Date = today;

    switch (preset) {
      case 'today':
        start = today;
        end = today;
        break;
      case 'yesterday':
        start = new Date(today);
        start.setDate(today.getDate() - 1);
        end = new Date(start);
        break;
      case 'last7':
        start = new Date(today);
        start.setDate(today.getDate() - 6);
        break;
      case 'last30':
        start = new Date(today);
        start.setDate(today.getDate() - 29);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        return;
    }

    this.startDate = this.formatDateForInput(start);
    this.endDate = this.formatDateForInput(end);
    this.validateAndEmit();
  }

  onDateChange() {
    this.validateAndEmit();
  }

  private validateAndEmit() {
    this.validationError = '';

    if (!this.startDate || !this.endDate) {
      this.validationError = 'Both start and end dates are required';
      return;
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    if (start > end) {
      this.validationError = 'End date must be after start date';
      return;
    }

    // Check if range is too large (>365 days)
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      this.validationError = 'Warning: Date range exceeds 365 days. This may impact performance.';
      // Allow but warn
    }

    this.dateRangeChange.emit({
      startDate: this.startDate,
      endDate: this.endDate
    });
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
