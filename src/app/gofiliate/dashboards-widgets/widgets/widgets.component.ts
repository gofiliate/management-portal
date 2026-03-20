import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { GofiliateService, Widget, WidgetType, SaveWidgetRequest } from '../../../services/gofiliate.service';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationModalComponent } from '../../../components/shared/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-widgets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ConfirmationModalComponent],
  templateUrl: './widgets.component.html',
  styleUrl: './widgets.component.scss'
})
export class WidgetsComponent implements OnInit {
  loading = false;
  saving = false;
  activeTab: 'management-portal' | 'admin-portal' | 'affiliate-portal' = 'management-portal';
  showForm = false;
  editMode = false;
  
  // All widgets
  widgets: Widget[] = [];
  filteredWidgets: Widget[] = [];
  widgetTypes: WidgetType[] = [];
  
  // Confirmation modal
  showDeleteModal = false;
  widgetToDelete: Widget | null = null;
  
  // Form
  widgetForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private gofiliateService: GofiliateService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    console.log('Widgets component initialized');
    this.initForm();
    this.loadWidgetTypes();
    this.loadWidgets();
  }

  initForm(): void {
    this.widgetForm = this.formBuilder.group({
      widget_id: [null],
      type_id: [null, Validators.required],
      slug: ['', [Validators.required, Validators.maxLength(32)]],
      header: ['', [Validators.required, Validators.maxLength(32)]],
      footer: ['', Validators.maxLength(32)],
      icon: ['', [Validators.required, Validators.maxLength(32)]],
      reference_id: [null]
    });
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
        this.toastr.error('Failed to load widget types');
      }
    });
  }

  setActiveTab(tab: 'management-portal' | 'admin-portal' | 'affiliate-portal'): void {
    this.activeTab = tab;
    this.filterWidgets();
    this.showForm = false;
    console.log('Active tab changed to:', tab);
  }

  loadWidgets(): void {
    this.loading = true;
    
    this.gofiliateService.getWidgets().subscribe({
      next: (response) => {
        if (response.result === 'success') {
          this.widgets = response.widgets;
          this.filterWidgets();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading widgets:', error);
        this.toastr.error('Failed to load widgets');
        this.loading = false;
      }
    });
  }

  filterWidgets(): void {
    // For now, show all widgets (we can add filtering later if needed)
    this.filteredWidgets = this.widgets;
  }

  openCreateForm(): void {
    this.editMode = false;
    this.showForm = true;
    this.widgetForm.reset({
      widget_id: null,
      type_id: null,
      slug: '',
      header: '',
      footer: '',
      icon: '',
      reference_id: null
    });
  }

  openEditForm(widget: Widget): void {
    this.editMode = true;
    this.showForm = true;
    this.widgetForm.patchValue({
      widget_id: widget.widget_id,
      type_id: widget.type_id,
      slug: widget.slug,
      header: widget.header,
      footer: widget.footer,
      icon: widget.icon,
      reference_id: widget.reference_id
    });
  }

  saveWidget(): void {
    if (this.widgetForm.invalid) {
      this.toastr.error('Please fill in all required fields');
      return;
    }

    this.saving = true;
    const formValue = this.widgetForm.value;

    const payload: SaveWidgetRequest = {
      widget_id: formValue.widget_id || 0,
      type_id: formValue.type_id,
      slug: formValue.slug,
      header: formValue.header,
      footer: formValue.footer,
      icon: formValue.icon,
      reference_id: formValue.reference_id,
      status: 1
    };

    this.gofiliateService.saveWidget(payload).subscribe({
      next: (response) => {
        this.toastr.success(this.editMode ? 'Widget updated successfully' : 'Widget created successfully');
        this.showForm = false;
        this.loadWidgets();
        this.saving = false;
      },
      error: (error) => {
        console.error('Error saving widget:', error);
        this.toastr.error('Failed to save widget');
        this.saving = false;
      }
    });
  }

  deleteWidget(widget: Widget): void {
    this.widgetToDelete = widget;
    this.showDeleteModal = true;
  }

  confirmDeleteWidget(): void {
    if (!this.widgetToDelete) return;

    this.gofiliateService.deactivateWidget(this.widgetToDelete.widget_id).subscribe({
      next: (response) => {
        this.toastr.success('Widget deleted successfully');
        this.loadWidgets();
        this.showDeleteModal = false;
        this.widgetToDelete = null;
      },
      error: (error) => {
        console.error('Error deleting widget:', error);
        this.toastr.error('Failed to delete widget');
        this.showDeleteModal = false;
        this.widgetToDelete = null;
      }
    });
  }

  cancelDeleteWidget(): void {
    this.showDeleteModal = false;
    this.widgetToDelete = null;
  }

  cancelForm(): void {
    this.showForm = false;
    this.widgetForm.reset();
  }

  getWidgetTypeName(typeId: number): string {
    const type = this.widgetTypes.find(t => t.type_id === typeId);
    return type ? type.slug : 'Unknown';
  }
}
