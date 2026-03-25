import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GofiliateService, SaveDashboardWidgetRequest, Dashboard, Widget, DashboardWidget } from '../../../services/gofiliate.service';
import { ToastrService } from 'ngx-toastr';
import { PageHeaderComponent, BreadcrumbItem } from '../../shared/page-header/page-header.component';

interface InfoPanelConfig {
  background_color: string;
  header_text: string;
  content_text: string;
  text_color: string;
  border_color: string;
}

@Component({
  selector: 'app-dashboards-widgets-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './dashboards-widgets-manager.component.html',
  styleUrl: './dashboards-widgets-manager.component.scss'
})
export class DashboardsWidgetsManagerComponent implements OnInit {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Gofiliate', link: '/gofiliate' },
    { label: 'Dashboards & Widgets' }
  ];

  dashboards: Dashboard[] = [];
  availableWidgets: Widget[] = [];
  dashboardWidgets: DashboardWidget[] = [];
  
  selectedDashboardId: number | null = null;
  isLoadingDashboards = true;
  isLoadingWidgets = false;
  
  // Edit modal state
  showEditModal = false;
  editMode: 'add' | 'edit' = 'add';
  editingWidget: Partial<SaveDashboardWidgetRequest> = {};
  useJsonEditor = false;
  jsonEditorText = '';
  
  // Info panel form
  infoPanelConfig: InfoPanelConfig = {
    background_color: '#f8f9fa',
    header_text: '',
    content_text: '',
    text_color: '#212529',
    border_color: '#dee2e6'
  };

  constructor(
    private gofiliateService: GofiliateService,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadDashboards();
  }

  loadDashboards(): void {
    this.isLoadingDashboards = true;
    this.gofiliateService.getDashboards().subscribe({
      next: (response) => {
        this.dashboards = response.dashboards;
        this.isLoadingDashboards = false;
        console.log('Dashboards loaded:', this.dashboards);
      },
      error: (err) => {
        console.error('Error loading dashboards:', err);
        this.toast.error('Failed to load dashboards');
        this.isLoadingDashboards = false;
      }
    });
  }

  onDashboardSelect(): void {
    if (this.selectedDashboardId) {
      this.loadDashboardWidgets();
      this.loadAvailableWidgets();
    }
  }

  loadDashboardWidgets(): void {
    if (!this.selectedDashboardId) return;
    
    this.isLoadingWidgets = true;
    this.gofiliateService.getDashboardWidgets(this.selectedDashboardId).subscribe({
      next: (response) => {
        this.dashboardWidgets = response.widgets;
        this.isLoadingWidgets = false;
        console.log('Dashboard widgets loaded:', this.dashboardWidgets);
      },
      error: (err) => {
        console.error('Error loading dashboard widgets:', err);
        this.toast.error('Failed to load widgets');
        this.isLoadingWidgets = false;
      }
    });
  }

  loadAvailableWidgets(): void {
    this.gofiliateService.getWidgets().subscribe({
      next: (response) => {
        this.availableWidgets = response.widgets.filter(w => w.status === 1);
        console.log('Available widgets loaded:', this.availableWidgets);
      },
      error: (err) => {
        console.error('Error loading available widgets:', err);
        this.toast.error('Failed to load available widgets');
      }
    });
  }

  openAddModal(): void {
    if (!this.selectedDashboardId) {
      this.toast.warning('Please select a dashboard first');
      return;
    }

    this.editMode = 'add';
    this.editingWidget = {
      dashboard_id: this.selectedDashboardId,
      row_id: 1,
      position_id: 1,
      widget_id: undefined,
      col_width: 6,
      widget_config: null
    };
    this.resetInfoPanelConfig();
    this.useJsonEditor = false;
    this.showEditModal = true;
  }

  openEditModal(widget: DashboardWidget): void {
    this.editMode = 'edit';
    this.editingWidget = {
      dashboard_id: widget.dashboard_id,
      row_id: widget.row_id,
      position_id: widget.position_id,
      widget_id: widget.widget_id,
      col_width: widget.col_width,
      widget_config: widget.widget_config
    };

    // Parse config based on widget type
    if (widget.component_name === 'InfoPanelComponent' && widget.widget_config) {
      try {
        this.infoPanelConfig = JSON.parse(widget.widget_config);
        this.useJsonEditor = false;
      } catch (e) {
        console.error('Failed to parse config, falling back to JSON editor:', e);
        this.jsonEditorText = widget.widget_config;
        this.useJsonEditor = true;
      }
    } else if (widget.widget_config) {
      this.jsonEditorText = widget.widget_config;
      this.useJsonEditor = true;
    }

    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingWidget = {};
    this.resetInfoPanelConfig();
  }

  resetInfoPanelConfig(): void {
    this.infoPanelConfig = {
      background_color: '#f8f9fa',
      header_text: '',
      content_text: '',
      text_color: '#212529',
      border_color: '#dee2e6'
    };
  }

  getSelectedWidgetType(): string | null {
    if (!this.editingWidget.widget_id) return null;
    const widget = this.availableWidgets.find(w => w.widget_id === this.editingWidget.widget_id);
    return widget ? this.getComponentNameFromWidget(widget) : null;
  }

  getComponentNameFromWidget(widget: Widget): string {
    // Look up widget type to get component name
    // For now, we'll use a simple mapping since we don't have the full widget type data here
    return 'InfoPanelComponent'; // This would need to be fetched properly
  }

  isInfoPanelWidget(): boolean {
    if (this.editMode === 'edit') {
      const widget = this.dashboardWidgets.find(w => 
        w.widget_id === this.editingWidget.widget_id &&
        w.row_id === this.editingWidget.row_id &&
        w.position_id === this.editingWidget.position_id
      );
      return widget?.component_name === 'InfoPanelComponent';
    }
    
    // For add mode, check selected widget
    const selectedWidget = this.availableWidgets.find(w => w.widget_id === this.editingWidget.widget_id);
    return selectedWidget?.slug === 'info-panel' || false;
  }

  toggleEditorMode(): void {
    if (this.useJsonEditor) {
      // Switching from JSON to form: parse JSON into form
      try {
        this.infoPanelConfig = JSON.parse(this.jsonEditorText);
        this.useJsonEditor = false;
      } catch (e) {
        this.toast.error('Invalid JSON. Please fix errors before switching to form mode.');
      }
    } else {
      // Switching from form to JSON: serialize form to JSON
      this.jsonEditorText = JSON.stringify(this.infoPanelConfig, null, 2);
      this.useJsonEditor = true;
    }
  }

  saveWidget(): void {
    if (!this.editingWidget.dashboard_id || !this.editingWidget.widget_id) {
      this.toast.error('Please select a widget');
      return;
    }

    // Build widget_config based on mode
    let widgetConfig: string | null = null;
    
    if (this.isInfoPanelWidget()) {
      if (this.useJsonEditor) {
        // Validate JSON
        try {
          JSON.parse(this.jsonEditorText);
          widgetConfig = this.jsonEditorText;
        } catch (e) {
          this.toast.error('Invalid JSON configuration');
          return;
        }
      } else {
        // Use form data
        widgetConfig = JSON.stringify(this.infoPanelConfig);
      }
    } else if (this.useJsonEditor && this.jsonEditorText.trim()) {
      widgetConfig = this.jsonEditorText;
    }

    const request: SaveDashboardWidgetRequest = {
      dashboard_id: this.editingWidget.dashboard_id,
      row_id: this.editingWidget.row_id!,
      position_id: this.editingWidget.position_id!,
      widget_id: this.editingWidget.widget_id,
      col_width: this.editingWidget.col_width!,
      widget_config: widgetConfig
    };

    this.gofiliateService.saveDashboardWidget(request).subscribe({
      next: () => {
        this.toast.success(this.editMode === 'add' ? 'Widget added successfully' : 'Widget updated successfully');
        this.closeEditModal();
        this.loadDashboardWidgets();
      },
      error: (err) => {
        console.error('Error saving widget:', err);
        this.toast.error('Failed to save widget');
      }
    });
  }

  deleteWidget(widget: DashboardWidget): void {
    if (!confirm(`Are you sure you want to remove this widget from the dashboard?`)) {
      return;
    }

    this.gofiliateService.deleteDashboardWidget(
      widget.dashboard_id,
      widget.row_id,
      widget.position_id
    ).subscribe({
      next: () => {
        this.toast.success('Widget removed successfully');
        this.loadDashboardWidgets();
      },
      error: (err) => {
        console.error('Error deleting widget:', err);
        this.toast.error('Failed to remove widget');
      }
    });
  }

  getWidgetsByRow(): Map<number, DashboardWidget[]> {
    const rowMap = new Map<number, DashboardWidget[]>();
    
    this.dashboardWidgets.forEach(widget => {
      if (!rowMap.has(widget.row_id)) {
        rowMap.set(widget.row_id, []);
      }
      rowMap.get(widget.row_id)!.push(widget);
    });

    // Sort widgets in each row by position_id
    rowMap.forEach(widgets => {
      widgets.sort((a, b) => a.position_id - b.position_id);
    });

    return rowMap;
  }

  getSortedRowIds(): number[] {
    return Array.from(this.getWidgetsByRow().keys()).sort((a, b) => a - b);
  }
}
