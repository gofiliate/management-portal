import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-widgets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './widgets.component.html',
  styleUrl: './widgets.component.scss'
})
export class WidgetsComponent implements OnInit {
  loading = false;
  activeTab: 'management-portal' | 'admin-portal' | 'affiliate-portal' = 'management-portal';
  showForm = false;
  editMode = false;
  
  // All widgets
  widgets: any[] = [];
  filteredWidgets: any[] = [];

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    console.log('Widgets component initialized');
    this.loadWidgets();
  }

  setActiveTab(tab: 'management-portal' | 'admin-portal' | 'affiliate-portal'): void {
    this.activeTab = tab;
    this.filterWidgets();
    this.showForm = false;
    console.log('Active tab changed to:', tab);
  }

  loadWidgets(): void {
    this.loading = true;
    
    // TODO: Replace with actual API calls
    // For now, mock empty data
    setTimeout(() => {
      this.widgets = [];
      this.filterWidgets();
      this.loading = false;
    }, 500);
  }

  filterWidgets(): void {
    this.filteredWidgets = this.widgets.filter(w => w.widget_type === this.activeTab);
  }

  openCreateForm(): void {
    this.editMode = false;
    this.showForm = true;
    console.log('Create widget for platform:', this.activeTab);
    // TODO: Implement create widget form
  }

  openEditForm(widget: any): void {
    this.editMode = true;
    this.showForm = true;
    console.log('Edit widget:', widget);
    // TODO: Implement edit widget form
  }

  deleteWidget(widget: any): void {
    if (!confirm(`Are you sure you want to delete this widget?`)) {
      return;
    }
    console.log('Delete widget:', widget);
    // TODO: Implement delete widget
  }

  cancelForm(): void {
    this.showForm = false;
  }
}
