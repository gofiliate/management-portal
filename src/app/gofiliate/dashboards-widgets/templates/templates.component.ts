import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './templates.component.html',
  styleUrl: './templates.component.scss'
})
export class TemplatesComponent implements OnInit {
  loading = false;
  activeTab: 'management-portal' | 'admin-portal' | 'affiliate-portal' = 'management-portal';
  showForm = false;
  editMode = false;
  
  // All templates
  templates: any[] = [];
  filteredTemplates: any[] = [];

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    console.log('Templates component initialized');
    this.loadTemplates();
  }

  setActiveTab(tab: 'management-portal' | 'admin-portal' | 'affiliate-portal'): void {
    this.activeTab = tab;
    this.filterTemplates();
    this.showForm = false;
    console.log('Active tab changed to:', tab);
  }

  loadTemplates(): void {
    this.loading = true;
    
    // TODO: Replace with actual API calls
    // For now, mock empty data
    setTimeout(() => {
      this.templates = [];
      this.filterTemplates();
      this.loading = false;
    }, 500);
  }

  filterTemplates(): void {
    this.filteredTemplates = this.templates.filter(t => t.template_type === this.activeTab);
  }

  openCreateForm(): void {
    this.editMode = false;
    this.showForm = true;
    console.log('Create template for platform:', this.activeTab);
    // TODO: Implement create template form
  }

  openEditForm(template: any): void {
    this.editMode = true;
    this.showForm = true;
    console.log('Edit template:', template);
    // TODO: Implement edit template form
  }

  deleteTemplate(template: any): void {
    if (!confirm(`Are you sure you want to delete this template?`)) {
      return;
    }
    console.log('Delete template:', template);
    // TODO: Implement delete template
  }

  cancelForm(): void {
    this.showForm = false;
  }
}
