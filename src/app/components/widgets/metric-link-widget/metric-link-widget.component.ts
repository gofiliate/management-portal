import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GofiliateService } from '../../../services/gofiliate.service';

interface MetricLinkConfig {
  api_endpoint: string;
  count_field?: string;
  link_url: string;
  label_singular: string;
  label_plural: string;
  icon?: string;
  color?: 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'secondary';
  hide_when_zero?: boolean;
}

@Component({
  selector: 'app-metric-link-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metric-link-widget.component.html',
  styleUrl: './metric-link-widget.component.scss'
})
export class MetricLinkWidgetComponent implements OnInit {
  @Input() widgetData: any;
  @Output() hasData = new EventEmitter<boolean>();
  @Output() hideRow = new EventEmitter<boolean>();

  config: MetricLinkConfig | null = null;
  count: number = 0;
  loading: boolean = true;
  error: boolean = false;

  constructor(
    private gofiliateService: GofiliateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('MetricLinkWidget initialized with data:', this.widgetData);
    this.parseConfig();
    if (this.config) {
      this.loadCount();
    } else {
      this.loading = false;
      this.error = true;
      this.hideRow.emit(false); // Don't hide row on config error
      this.hasData.emit(false);
    }
  }

  private parseConfig(): void {
    if (this.widgetData?.widget_config) {
      try {
        this.config = typeof this.widgetData.widget_config === 'string' 
          ? JSON.parse(this.widgetData.widget_config) 
          : this.widgetData.widget_config;
        console.log('Parsed metric link config:', this.config);
      } catch (e) {
        console.error('Failed to parse widget_config:', e);
        this.config = null;
      }
    }
  }

  private loadCount(): void {
    if (!this.config?.api_endpoint) {
      this.loading = false;
      this.error = true;
      this.hasData.emit(false);
      return;
    }

    // Use the ApiService through GofiliateService
    // Extract the path from the endpoint (remove leading slash if present)
    const endpoint = this.config.api_endpoint.startsWith('/') 
      ? this.config.api_endpoint.substring(1) 
      : this.config.api_endpoint;

    // Make generic API call
    (this.gofiliateService as any).apiService.get(endpoint, false).subscribe({
      next: (response: any) => {
        console.log('Metric link API response:', response);
        
        // Handle null/undefined responses
        if (!response) {
          this.count = 0;
        }
        // If response is an array, use its length
        else if (Array.isArray(response)) {
          this.count = response.length;
        } 
        // Otherwise, look for the count field in the response object
        else {
          const countField = this.config!.count_field || 'count';
          this.count = response[countField] ?? 0;
        }
        
        this.loading = false;
        
        // Determine if we should hide based on configuration
        const shouldHideWhenZero = this.config!.hide_when_zero !== false; // defaults to true
        const shouldHideRow = shouldHideWhenZero && this.count === 0;
        
        // Emit hideRow signal - if true, tells the row to hide regardless of other widgets
        this.hideRow.emit(shouldHideRow);
        
        // Emit hasData for individual widget visibility (currently not used for hiding the widget itself)
        this.hasData.emit(this.count > 0);
        
        console.log(`Metric widget: count=${this.count}, hide_when_zero=${shouldHideWhenZero}, hideRow=${shouldHideRow}`);
      },
      error: (err: any) => {
        console.error('Error loading metric count:', err);
        this.error = true;
        this.loading = false;
        this.hideRow.emit(false); // Don't hide row on error
        this.hasData.emit(false);
      }
    });
  }

  get label(): string {
    if (!this.config) return '';
    return this.count === 1 ? this.config.label_singular : this.config.label_plural;
  }

  get iconClass(): string {
    return this.config?.icon || this.widgetData?.icon || 'fa-chart-line';
  }

  get colorClass(): string {
    const color = this.config?.color || 'primary';
    return `bg-${color}`;
  }

  get textColorClass(): string {
    const color = this.config?.color || 'primary';
    // Use white text for darker backgrounds
    return ['primary', 'success', 'danger'].includes(color) ? 'text-white' : 'text-dark';
  }

  onClick(): void {
    if (this.config?.link_url && !this.loading && !this.error) {
      this.router.navigate([this.config.link_url]);
    }
  }
}
