import { Component, Input, OnInit, OnChanges, ViewChild, ViewContainerRef, ComponentRef, Type, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InstanceLoginWidgetComponent } from '../instance-login-widget/instance-login-widget.component';
import { InfoPanelWidgetComponent } from '../info-panel-widget/info-panel-widget.component';
import { MetricLinkWidgetComponent } from '../metric-link-widget/metric-link-widget.component';

@Component({
  selector: 'app-dynamic-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dynamic-widget-wrapper">
      <ng-container #widgetHost></ng-container>
      
      <!-- Fallback for unknown widget types -->
      <div *ngIf="!componentLoaded" class="card">
        <div class="card-body text-center text-muted">
          <i class="fa fa-exclamation-circle fa-2x mb-2"></i>
          <p>Unknown widget type: {{ widgetData?.component_name }}</p>
          <small>{{ widgetData?.header }}</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dynamic-widget-wrapper {
      height: 100%;
    }
  `]
})
export class DynamicWidgetComponent implements OnInit, OnChanges {
  @Input() widgetData: any;
  @Output() hasData = new EventEmitter<boolean>();
  @Output() hideRow = new EventEmitter<boolean>();
  @ViewChild('widgetHost', { read: ViewContainerRef, static: true }) 
  widgetHost!: ViewContainerRef;

  componentLoaded = false;
  private componentRef: ComponentRef<any> | null = null;

  // Map of component names to actual component classes
  private componentMap: { [key: string]: Type<any> } = {
    'InstanceLoginComponent': InstanceLoginWidgetComponent,
    'InfoPanelComponent': InfoPanelWidgetComponent,
    'MetricLinkComponent': MetricLinkWidgetComponent,
    // Add more widget components here as they are created
    // 'StatsWidgetComponent': StatsWidgetComponent,
    // 'ChartWidgetComponent': ChartWidgetComponent,
  };

  ngOnInit(): void {
    this.loadComponent();
  }

  ngOnChanges(): void {
    if (this.componentLoaded) {
      this.loadComponent();
    }
  }

  private loadComponent(): void {
    if (!this.widgetData || !this.widgetData.component_name) {
      console.error('No widget data or component name provided');
      return;
    }

    const componentClass = this.componentMap[this.widgetData.component_name];
    
    if (!componentClass) {
      console.error('Unknown widget type:', this.widgetData.component_name);
      console.log('Available components:', Object.keys(this.componentMap));
      this.componentLoaded = false;
      return;
    }

    // Clear any existing component
    this.widgetHost.clear();
    if (this.componentRef) {
      this.componentRef.destroy();
    }

    // Create the new component
    this.componentRef = this.widgetHost.createComponent(componentClass);
    
    // Pass the widget data to the component instance
    this.componentRef.instance.widgetData = this.widgetData;

    // Subscribe to hasData events from widgets that support it (like metric-link)
    if (this.componentRef.instance.hasData) {
      this.componentRef.instance.hasData.subscribe((hasData: boolean) => {
        console.log(`Dynamic widget received hasData event: ${hasData} for widget:`, this.widgetData.component_name);
        this.hasData.emit(hasData);
      });
    } else {
      // For widgets without hasData, assume they always have data
      this.hasData.emit(true);
    }

    // Subscribe to hideRow events from widgets that support it (like metric-link with hide_when_zero)
    if (this.componentRef.instance.hideRow) {
      this.componentRef.instance.hideRow.subscribe((shouldHideRow: boolean) => {
        console.log(`Dynamic widget received hideRow event: ${shouldHideRow} for widget:`, this.widgetData.component_name);
        this.hideRow.emit(shouldHideRow);
      });
    } else {
      // For widgets without hideRow, emit false (don't hide row)
      this.hideRow.emit(false);
    }

    this.componentLoaded = true;
    console.log('Loaded widget component:', this.widgetData.component_name);
  }

  ngOnDestroy(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }
}
