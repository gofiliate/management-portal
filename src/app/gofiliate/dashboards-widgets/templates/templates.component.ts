import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { GofiliateService, Dashboard, Widget, DashboardWidget, WidgetType } from '../../../services/gofiliate.service';
import { ToastrService } from 'ngx-toastr';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ConfirmationModalComponent } from '../../../components/shared/confirmation-modal/confirmation-modal.component';

interface InfoPanelConfig {
  header_text: string;
  content_text: string;
  background_color?: string;
  text_color?: string;
  border_color?: string;
}

interface MetricLinkConfig {
  api_endpoint: string;
  count_field: string;
  link_url: string;
  label_singular: string;
  label_plural: string;
  icon: string;
  color: string;
  hide_when_zero: boolean;
}

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DragDropModule, ConfirmationModalComponent],
  templateUrl: './templates.component.html',
  styleUrl: './templates.component.scss'
})
export class TemplatesComponent implements OnInit {
  loading = false;
  saving = false;
  activeTab: 'management-portal' | 'admin-portal' | 'affiliate-portal' = 'management-portal';
  
  // Widget config editing
  editorMode: 'form' | 'json' = 'form';
  jsonConfigText: string = '';
  infoPanelConfig: InfoPanelConfig = {
    header_text: '',
    content_text: '',
    background_color: '#f8f9fa',
    text_color: '#212529',
    border_color: '#dee2e6'
  };
  metricLinkConfig: MetricLinkConfig = {
    api_endpoint: '',
    count_field: 'count',
    link_url: '',
    label_singular: '',
    label_plural: '',
    icon: 'fa-chart-line',
    color: 'primary',
    hide_when_zero: true
  };
  
  // View modes
  viewMode: 'list' | 'builder' = 'list';
  showDashboardForm = false;
  editMode = false;
  
  // Dashboards
  dashboards: Dashboard[] = [];
  filteredDashboards: Dashboard[] = [];
  selectedDashboard: Dashboard | null = null;
  
  // Widgets
  availableWidgets: Widget[] = [];
  dashboardWidgets: DashboardWidget[] = [];
  widgetTypes: WidgetType[] = [];
  
  // Grid structure: array of rows, each row contains widgets
  gridRows: DashboardWidget[][] = [];
  
  // Confirmation modals
  showDeleteDashboardModal = false;
  dashboardToDelete: Dashboard | null = null;
  showRemoveWidgetModal = false;
  widgetToRemove: DashboardWidget | null = null;
  
  // Widget configuration modal
  showWidgetConfigModal = false;
  widgetConfigForm!: FormGroup;
  widgetToConfig: {
    widget: Widget;
    rowIndex: number;
    position: number;
    existingWidget?: DashboardWidget;
  } | null = null;
  colWidthOptions = [3, 4, 6, 8, 9, 12];
  
  // Instances for dropdown
  availableInstances: Array<{instance_id: number, instance_name: string, client_name?: string}> = [];
  loadingInstances = false;
  
  // Form
  dashboardForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private gofiliateService: GofiliateService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    console.log('Templates component initialized');
    this.initForm();
    this.loadDashboards();
    this.loadWidgetTypes();
    this.loadAvailableWidgets();
  }

  initForm(): void {
    this.dashboardForm = this.formBuilder.group({
      dashboard_id: [null],
      description: ['', [Validators.required, Validators.maxLength(255)]]
    });

    this.widgetConfigForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      reference_id: [null],
      col_width: [3, Validators.required]
    });
  }

  setActiveTab(tab: 'management-portal' | 'admin-portal' | 'affiliate-portal'): void {
    this.activeTab = tab;
    this.filterDashboards();
    this.viewMode = 'list';
    this.showDashboardForm = false;
    this.selectedDashboard = null;
    console.log('Active tab changed to:', tab);
  }

  loadWidgetTypes(): void {
    this.gofiliateService.getWidgetTypes().subscribe({
      next: (response) => {
        if (response.result === 'success') {
          this.widgetTypes = response.widget_types;
        }
      },
      error: (error) => {
        console.error('Error loading widget types:', error);
      }
    });
  }

  loadAvailableWidgets(): void {
    this.gofiliateService.getWidgets().subscribe({
      next: (response) => {
        if (response.result === 'success') {
          this.availableWidgets = response.widgets;
        }
      },
      error: (error) => {
        console.error('Error loading widgets:', error);
        this.toastr.error('Failed to load available widgets');
      }
    });
  }

  loadDashboards(): void {
    this.loading = true;
    this.gofiliateService.getDashboards().subscribe({
      next: (response: any) => {
        this.dashboards = response.dashboards || [];
        this.filterDashboards();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading dashboards:', error);
        this.toastr.error('Failed to load dashboards');
        this.loading = false;
      }
    });
  }

  filterDashboards(): void {
    this.filteredDashboards = this.dashboards.filter(d => d.dashboard_type === this.activeTab);
  }

  openCreateForm(): void {
    this.editMode = false;
    this.showDashboardForm = true;
    this.viewMode = 'list';
    this.dashboardForm.reset();
    console.log('Create dashboard for platform:', this.activeTab);
  }

  openLayoutBuilder(dashboard: Dashboard): void {
    this.selectedDashboard = dashboard;
    this.viewMode = 'builder';
    this.loadDashboardWidgets(dashboard.dashboard_id);
  }

  loadDashboardWidgets(dashboardId: number): void {
    this.loading = true;
    this.gofiliateService.getDashboardWidgets(dashboardId).subscribe({
      next: (response) => {
        if (response.result === 'success') {
          this.dashboardWidgets = response.widgets;
          this.organizeWidgetsIntoGrid();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard widgets:', error);
        this.toastr.error('Failed to load dashboard widgets');
        this.loading = false;
      }
    });
  }

  organizeWidgetsIntoGrid(): void {
    // Group widgets by row_id
    const rowMap = new Map<number, DashboardWidget[]>();
    
    this.dashboardWidgets.forEach(widget => {
      if (!rowMap.has(widget.row_id)) {
        rowMap.set(widget.row_id, []);
      }
      rowMap.get(widget.row_id)!.push(widget);
    });

    // Convert to array and sort
    this.gridRows = Array.from(rowMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([_, widgets]) => widgets.sort((a, b) => a.position_id - b.position_id));

    // Ensure at least one empty row for adding widgets
    if (this.gridRows.length === 0) {
      this.gridRows.push([]);
    }
  }

  backToList(): void {
    this.viewMode = 'list';
    this.selectedDashboard = null;
    this.dashboardWidgets = [];
    this.gridRows = [];
  }

  saveDashboard(): void {
    if (this.dashboardForm.invalid) {
      this.toastr.error('Please fill in all required fields');
      return;
    }

    const formValue = this.dashboardForm.value;
    const payload = {
      dashboard_id: formValue.dashboard_id || 0,
      dashboard_type: this.activeTab,
      description: formValue.description,
      status: 1
    };

    this.loading = true;

    if (this.editMode) {
      // Update existing dashboard
      this.gofiliateService.updateDashboard(payload.dashboard_id, payload).subscribe({
        next: () => {
          this.toastr.success('Dashboard updated successfully');
          this.showDashboardForm = false;
          this.loadDashboards();
        },
        error: (error) => {
          console.error('Error updating dashboard:', error);
          this.toastr.error('Failed to update dashboard');
          this.loading = false;
        }
      });
    } else {
      // Create new dashboard
      this.gofiliateService.saveDashboard(payload).subscribe({
        next: () => {
          this.toastr.success('Dashboard created successfully');
          this.showDashboardForm = false;
          this.loadDashboards();
        },
        error: (error) => {
          console.error('Error creating dashboard:', error);
          this.toastr.error('Failed to create dashboard');
          this.loading = false;
        }
      });
    }
  }

  onWidgetDrop(event: CdkDragDrop<any>, rowIndex: number): void {
    console.log('Widget dropped:', {
      previousContainer: event.previousContainer.id,
      currentContainer: event.container.id,
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
      rowIndex
    });

    if (event.previousContainer === event.container) {
      // Reorder within same row
      console.log('Reordering within same row');
      if (event.previousIndex !== event.currentIndex) {
        moveItemInArray(this.gridRows[rowIndex], event.previousIndex, event.currentIndex);
        console.log('Row after reorder:', this.gridRows[rowIndex]);
        this.recalculatePositions(rowIndex);
      }
    } else if (event.previousContainer.id === 'widget-library') {
      // Add new widget from library
      console.log('Adding widget from library');
      const widget = event.item.data as Widget;
      this.addWidgetToRow(widget, rowIndex, event.currentIndex);
    } else {
      // Move widget from another row
      console.log('Moving widget between rows');
      const previousRowIndex = parseInt(event.previousContainer.id.replace('row-', ''));
      transferArrayItem(
        this.gridRows[previousRowIndex],
        this.gridRows[rowIndex],
        event.previousIndex,
        event.currentIndex
      );
      // Update both rows
      this.recalculatePositions(previousRowIndex);
      this.recalculatePositions(rowIndex);
    }
  }

  addWidgetToRow(widget: Widget, rowIndex: number, position: number): void {
    // Open configuration modal instead of saving directly
    this.widgetToConfig = {
      widget,
      rowIndex,
      position
    };

    // Load instances if this is an instance-login widget
    if (widget.slug === 'quick-login' || widget.slug.includes('instance-login') || widget.slug.includes('login')) {
      this.loadAvailableInstances();
    }

    // Reset editor mode and widget configs
    this.editorMode = 'form';
    this.infoPanelConfig = {
      header_text: '',
      content_text: '',
      background_color: '#f8f9fa',
      text_color: '#212529',
      border_color: '#dee2e6'
    };
    this.metricLinkConfig = {
      api_endpoint: '',
      count_field: 'count',
      link_url: '',
      label_singular: '',
      label_plural: '',
      icon: 'fa-chart-line',
      color: 'primary',
      hide_when_zero: true
    };
    this.jsonConfigText = '';

    // Pre-fill form with widget defaults
    this.widgetConfigForm.patchValue({
      title: widget.header,
      reference_id: widget.reference_id,
      col_width: 3
    });

    this.showWidgetConfigModal = true;
  }

  editWidgetConfig(widget: DashboardWidget): void {
    // Find the widget in availableWidgets to get full details
    const sourceWidget = this.availableWidgets.find(w => w.widget_id === widget.widget_id);
    if (!sourceWidget) return;

    const rowIndex = this.gridRows.findIndex(row => row.some(w => 
      w.dashboard_id === widget.dashboard_id && 
      w.row_id === widget.row_id && 
      w.position_id === widget.position_id
    ));
    const position = widget.position_id - 1;

    this.widgetToConfig = {
      widget: sourceWidget,
      rowIndex,
      position,
      existingWidget: widget
    };

    // Load instances if this is an instance-login widget
    if (sourceWidget.slug === 'quick-login' || sourceWidget.slug.includes('instance-login') || sourceWidget.slug.includes('login')) {
      this.loadAvailableInstances();
    }

    // Parse existing config
    let customTitle = widget.header;
    let referenceId = widget.reference_id;

    // Reset editor mode
    this.editorMode = 'form';

    if (widget.widget_config) {
      try {
        const config = JSON.parse(widget.widget_config);
        
        // Check if this is an info-panel widget
        if (this.isInfoPanelWidget()) {
          this.infoPanelConfig = {
            header_text: config.header_text || '',
            content_text: config.content_text || '',
            background_color: config.background_color || '#f8f9fa',
            text_color: config.text_color || '#212529',
            border_color: config.border_color || '#dee2e6'
          };
          this.jsonConfigText = JSON.stringify(config, null, 2);
        } else if (this.isMetricLinkWidget()) {
          this.metricLinkConfig = {
            api_endpoint: config.api_endpoint || '',
            count_field: config.count_field || 'count',
            link_url: config.link_url || '',
            label_singular: config.label_singular || '',
            label_plural: config.label_plural || '',
            icon: config.icon || 'fa-chart-line',
            color: config.color || 'primary',
            hide_when_zero: config.hide_when_zero !== undefined ? config.hide_when_zero : true
          };
          this.jsonConfigText = JSON.stringify(config, null, 2);
        } else {
          // For other widgets, parse custom_title and reference_id
          if (config.custom_title) {
            customTitle = config.custom_title;
          }
          if (config.reference_id !== undefined) {
            referenceId = config.reference_id;
          }
          this.jsonConfigText = JSON.stringify(config, null, 2);
        }
      } catch (e) {
        console.warn('Failed to parse widget_config:', e);
        this.jsonConfigText = widget.widget_config || '';
      }
    }

    // Pre-fill form with existing config
    this.widgetConfigForm.patchValue({
      title: customTitle,
      reference_id: referenceId,
      col_width: widget.col_width
    });

    this.showWidgetConfigModal = true;
  }

  saveWidgetConfiguration(): void {
    if (!this.selectedDashboard || !this.widgetToConfig || this.widgetConfigForm.invalid) return;

    const formValue = this.widgetConfigForm.value;
    let widgetConfig: any;

    // Build widget_config based on widget type and editor mode
    if (this.isInfoPanelWidget()) {
      if (this.editorMode === 'form') {
        widgetConfig = {
          header_text: this.infoPanelConfig.header_text,
          content_text: this.infoPanelConfig.content_text,
          background_color: this.infoPanelConfig.background_color,
          text_color: this.infoPanelConfig.text_color,
          border_color: this.infoPanelConfig.border_color
        };
      } else {
        try {
          widgetConfig = JSON.parse(this.jsonConfigText);
        } catch (e) {
          this.toastr.error('Invalid JSON in configuration');
          return;
        }
      }
    } else if (this.isMetricLinkWidget()) {
      if (this.editorMode === 'form') {
        widgetConfig = {
          api_endpoint: this.metricLinkConfig.api_endpoint,
          count_field: this.metricLinkConfig.count_field,
          link_url: this.metricLinkConfig.link_url,
          label_singular: this.metricLinkConfig.label_singular,
          label_plural: this.metricLinkConfig.label_plural,
          icon: this.metricLinkConfig.icon,
          color: this.metricLinkConfig.color,
          hide_when_zero: this.metricLinkConfig.hide_when_zero
        };
      } else {
        try {
          widgetConfig = JSON.parse(this.jsonConfigText);
        } catch (e) {
          this.toastr.error('Invalid JSON in configuration');
          return;
        }
      }
    } else {
      if (this.editorMode === 'json' && this.jsonConfigText.trim()) {
        try {
          widgetConfig = JSON.parse(this.jsonConfigText);
        } catch (e) {
          this.toastr.error('Invalid JSON in configuration');
          return;
        }
      } else {
        widgetConfig = {
          custom_title: formValue.title,
          reference_id: formValue.reference_id
        };
      }
    }

    const targetRowId = this.widgetToConfig.rowIndex + 1;
    const targetPositionId = this.widgetToConfig.position + 1;

    // If this is a new widget (not editing existing), shift widgets to make room
    if (!this.widgetToConfig.existingWidget) {
      const widgetsInRow = this.gridRows[this.widgetToConfig.rowIndex];
      const widgetsToShift = widgetsInRow.filter(w => w.position_id >= targetPositionId);
      
      if (widgetsToShift.length > 0) {
        // Shift widgets to the right first (in reverse order to avoid conflicts)
        widgetsToShift.sort((a, b) => b.position_id - a.position_id).forEach(widget => {
          this.updateWidgetPosition(widget, targetRowId, widget.position_id + 1);
        });
        
        // Wait a bit for shifts to complete, then add new widget
        setTimeout(() => {
          this.saveNewWidget(targetRowId, targetPositionId, formValue.col_width, widgetConfig);
        }, 500);
        return;
      }
    }

    // No shifting needed - save directly
    this.saveNewWidget(targetRowId, targetPositionId, formValue.col_width, widgetConfig);
  }

  private saveNewWidget(rowId: number, positionId: number, colWidth: any, widgetConfig: any): void {
    const payload = {
      dashboard_id: this.selectedDashboard!.dashboard_id,
      row_id: rowId,
      position_id: positionId,
      widget_id: this.widgetToConfig!.widget.widget_id,
      col_width: parseInt(colWidth, 10),
      widget_config: JSON.stringify(widgetConfig)
    };

    this.saving = true;
    this.gofiliateService.saveDashboardWidget(payload).subscribe({
      next: () => {
        this.toastr.success('Widget configured successfully');
        this.showWidgetConfigModal = false;
        this.widgetToConfig = null;
        this.widgetConfigForm.reset();
        this.loadDashboardWidgets(this.selectedDashboard!.dashboard_id);
        this.saving = false;
      },
      error: (error) => {
        console.error('Error configuring widget:', error);
        this.toastr.error('Failed to configure widget');
        this.saving = false;
      }
    });
  }

  cancelWidgetConfiguration(): void {
    this.showWidgetConfigModal = false;
    this.widgetToConfig = null;
    this.widgetConfigForm.reset();
  }

  recalculatePositions(rowIndex: number): void {
    // After reordering, update position_ids in database
    const widgets = this.gridRows[rowIndex];
    console.log(`Recalculating positions for row ${rowIndex}:`, widgets.map(w => ({ 
      header: w.header, 
      old_position: w.position_id, 
      new_position: widgets.indexOf(w) + 1 
    })));
    
    widgets.forEach((widget, index) => {
      const newPosition = index + 1;
      if (widget.position_id !== newPosition) {
        console.log(`Updating position: ${widget.header} from ${widget.position_id} to ${newPosition}`);
        this.updateWidgetPosition(widget, rowIndex + 1, newPosition);
      }
    });
  }

  updateWidgetPosition(widget: DashboardWidget, rowId: number, positionId: number): void {
    const payload = {
      dashboard_id: widget.dashboard_id,
      row_id: rowId,
      position_id: positionId,
      widget_id: widget.widget_id,
      col_width: widget.col_width,
      widget_config: widget.widget_config
    };

    this.gofiliateService.saveDashboardWidget(payload).subscribe({
      next: () => {
        // Update the widget object with new position
        widget.row_id = rowId;
        widget.position_id = positionId;
        console.log(`Position updated successfully: ${widget.header} now at row ${rowId}, position ${positionId}`);
      },
      error: (error) => {
        console.error('Error updating widget position:', error);
        this.toastr.error('Failed to update widget position');
      }
    });
  }

  removeWidgetFromDashboard(widget: DashboardWidget): void {
    this.widgetToRemove = widget;
    this.showRemoveWidgetModal = true;
  }

  confirmRemoveWidget(): void {
    if (!this.widgetToRemove) return;

    this.gofiliateService.deleteDashboardWidget(
      this.widgetToRemove.dashboard_id,
      this.widgetToRemove.row_id,
      this.widgetToRemove.position_id
    ).subscribe({
      next: () => {
        this.toastr.success('Widget removed successfully');
        this.loadDashboardWidgets(this.widgetToRemove!.dashboard_id);
        this.showRemoveWidgetModal = false;
        this.widgetToRemove = null;
      },
      error: (error) => {
        console.error('Error removing widget:', error);
        this.toastr.error('Failed to remove widget');
        this.showRemoveWidgetModal = false;
        this.widgetToRemove = null;
      }
    });
  }

  cancelRemoveWidget(): void {
    this.showRemoveWidgetModal = false;
    this.widgetToRemove = null;
  }

  addNewRow(): void {
    this.gridRows.push([]);
  }

  getRowTotalWidth(row: DashboardWidget[]): number {
    return row.reduce((sum, widget) => sum + widget.col_width, 0);
  }

  deleteDashboard(dashboard: Dashboard): void {
    this.dashboardToDelete = dashboard;
    this.showDeleteDashboardModal = true;
  }

  confirmDeleteDashboard(): void {
    if (!this.dashboardToDelete) return;

    this.gofiliateService.deactivateDashboard(this.dashboardToDelete.dashboard_id).subscribe({
      next: () => {
        this.toastr.success('Dashboard deleted successfully');
        this.loadDashboards();
        this.showDeleteDashboardModal = false;
        this.dashboardToDelete = null;
      },
      error: (error) => {
        console.error('Error deleting dashboard:', error);
        this.toastr.error('Failed to delete dashboard');
        this.showDeleteDashboardModal = false;
        this.dashboardToDelete = null;
      }
    });
  }

  cancelDeleteDashboard(): void {
    this.showDeleteDashboardModal = false;
    this.dashboardToDelete = null;
  }

  getRowIds(): string[] {
    return this.gridRows.map((_, index) => `row-${index}`);
  }

  getConnectedLists(currentRowIndex: number): string[] {
    // Connect to library and all other rows
    const lists = ['widget-library'];
    for (let i = 0; i < this.gridRows.length; i++) {
      if (i !== currentRowIndex) {
        lists.push(`row-${i}`);
      }
    }
    return lists;
  }

  getWidgetDisplayTitle(widget: DashboardWidget): string {
    if (widget.widget_config) {
      try {
        const config = JSON.parse(widget.widget_config);
        if (config.custom_title) {
          return config.custom_title;
        }
      } catch (e) {
        console.warn('Failed to parse widget_config:', e);
      }
    }
    return widget.header;
  }

  getWidgetReferenceId(widget: DashboardWidget): number | null {
    if (widget.widget_config) {
      try {
        const config = JSON.parse(widget.widget_config);
        if (config.reference_id) {
          return config.reference_id;
        }
      } catch (e) {
        console.warn('Failed to parse widget_config:', e);
      }
    }
    return widget.reference_id || null;
  }

  loadAvailableInstances(): void {
    this.loadingInstances = true;
    
    this.gofiliateService.listAllInstances().subscribe({
      next: (instances) => {
        this.availableInstances = instances || [];
        this.loadingInstances = false;
      },
      error: (error) => {
        console.error('Error loading instances:', error);
        this.toastr.error('Failed to load instances');
        this.availableInstances = [];
        this.loadingInstances = false;
      }
    });
  }

  isLoginWidget(): boolean {
    if (!this.widgetToConfig) return false;
    const slug = this.widgetToConfig.widget.slug;
    return slug === 'quick-login' || slug.includes('instance-login') || slug.includes('login');
  }

  isInfoPanelWidget(): boolean {
    if (!this.widgetToConfig) return false;
    // Check if the widget's type is 'info-panel'
    // Widget instances like 'help-panel' and 'welcome-panel' use the 'info-panel' type
    const widgetType = this.widgetTypes.find(t => t.type_id === this.widgetToConfig!.widget.type_id);
    return widgetType?.slug === 'info-panel';
  }

  isMetricLinkWidget(): boolean {
    if (!this.widgetToConfig) return false;
    const widgetType = this.widgetTypes.find(t => t.type_id === this.widgetToConfig!.widget.type_id);
    return widgetType?.slug === 'metric-link';
  }

  toggleEditorMode(): void {
    if (this.editorMode === 'form') {
      // Switch to JSON - convert form to JSON
      if (this.isInfoPanelWidget()) {
        const config = {
          header_text: this.infoPanelConfig.header_text,
          content_text: this.infoPanelConfig.content_text,
          background_color: this.infoPanelConfig.background_color,
          text_color: this.infoPanelConfig.text_color,
          border_color: this.infoPanelConfig.border_color
        };
        this.jsonConfigText = JSON.stringify(config, null, 2);
      } else if (this.isMetricLinkWidget()) {
        const config = {
          api_endpoint: this.metricLinkConfig.api_endpoint,
          count_field: this.metricLinkConfig.count_field,
          link_url: this.metricLinkConfig.link_url,
          label_singular: this.metricLinkConfig.label_singular,
          label_plural: this.metricLinkConfig.label_plural,
          icon: this.metricLinkConfig.icon,
          color: this.metricLinkConfig.color,
          hide_when_zero: this.metricLinkConfig.hide_when_zero
        };
        this.jsonConfigText = JSON.stringify(config, null, 2);
      }
      this.editorMode = 'json';
    } else {
      // Switch to form - parse JSON if possible
      if (this.isInfoPanelWidget() && this.jsonConfigText.trim()) {
        try {
          const config = JSON.parse(this.jsonConfigText);
          this.infoPanelConfig = {
            header_text: config.header_text || '',
            content_text: config.content_text || '',
            background_color: config.background_color || '#f8f9fa',
            text_color: config.text_color || '#212529',
            border_color: config.border_color || '#dee2e6'
          };
          this.editorMode = 'form';
        } catch (e) {
          this.toastr.error('Invalid JSON - cannot switch to form mode');
          return;
        }
      } else if (this.isMetricLinkWidget() && this.jsonConfigText.trim()) {
        try {
          const config = JSON.parse(this.jsonConfigText);
          this.metricLinkConfig = {
            api_endpoint: config.api_endpoint || '',
            count_field: config.count_field || 'count',
            link_url: config.link_url || '',
            label_singular: config.label_singular || '',
            label_plural: config.label_plural || '',
            icon: config.icon || 'fa-chart-line',
            color: config.color || 'primary',
            hide_when_zero: config.hide_when_zero !== undefined ? config.hide_when_zero : true
          };
          this.editorMode = 'form';
        } catch (e) {
          this.toastr.error('Invalid JSON - cannot switch to form mode');
          return;
        }
      } else {
        this.editorMode = 'form';
      }
    }
  }

  cancelForm(): void {
    this.showDashboardForm = false;
    this.dashboardForm.reset();
  }
}
