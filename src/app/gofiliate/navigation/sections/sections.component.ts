import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { GofiliateService, NavigationSection, SaveSectionRequest } from '../../../services/gofiliate.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-sections',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule, DragDropModule],
  templateUrl: './sections.component.html',
  styleUrl: './sections.component.scss'
})
export class SectionsComponent implements OnInit {
  sections: NavigationSection[] = [];
  loading = false;
  showForm = false;
  editMode = false;
  sectionForm: FormGroup;

  constructor(
    private gofiliateService: GofiliateService,
    private formBuilder: FormBuilder,
    private toast: ToastrService
  ) {
    this.sectionForm = this.formBuilder.group({
      section_id: [null],
      section_name: ['', Validators.required],
      section_description: ['', Validators.required],
      section_slug: ['', Validators.required],
      section_icon: [''],
      order: [0, [Validators.required, Validators.min(0)]],
      status: [1, Validators.required]
    });
  }

  ngOnInit(): void {
    console.log('Sections component initialized');
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    console.log('Loading sections - loading set to true');
    
    this.gofiliateService.getSections().subscribe({
      next: (response) => {
        console.log('Sections response:', response);
        this.loading = false;
        console.log('Loading set to false');
        if (response.result) {
          this.sections = response.sections;
          console.log('Loaded sections:', this.sections.length);
        } else {
          console.warn('Sections response result was false');
          this.sections = [];
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading sections:', error);
        this.toast.error('Failed to load sections. Make sure the backend is running.');
        this.sections = [];
      }
    });
  }

  openCreateForm(): void {
    this.editMode = false;
    this.showForm = true;
    this.sectionForm.reset({
      section_id: null,
      section_name: '',
      section_description: '',
      section_slug: '',
      section_icon: '',
      order: 0,
      status: 1
    });
  }

  openEditForm(section: NavigationSection): void {
    this.editMode = true;
    this.showForm = true;
    
    this.sectionForm.patchValue({
      section_id: section.section_id,
      section_name: section.section_name,
      section_description: section.section_description,
      section_slug: section.section_slug,
      section_icon: section.section_icon || '',
      order: section.order,
      status: section.status
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.sectionForm.reset();
  }

  saveSection(): void {
    if (this.sectionForm.invalid) {
      this.toast.warning('Please fill all required fields');
      return;
    }

    const formValue = this.sectionForm.value;
    
    const request: SaveSectionRequest = {
      section_name: formValue.section_name,
      section_description: formValue.section_description,
      section_slug: formValue.section_slug,
      section_icon: formValue.section_icon || '',
      order: Number(formValue.order),
      status: Number(formValue.status)
    };

    if (this.editMode && formValue.section_id) {
      request.section_id = Number(formValue.section_id);
    }

    this.loading = true;
    this.gofiliateService.saveSection(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.result) {
          this.toast.success(this.editMode ? 'Section updated successfully' : 'Section created successfully');
          this.showForm = false;
          this.loadData();
        } else {
          this.toast.error(response.message || 'Failed to save section');
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error saving section:', error);
        this.toast.error('Failed to save section');
      }
    });
  }

  deactivateSection(section: NavigationSection): void {
    if (!confirm(`Are you sure you want to deactivate "${section.section_name}"?`)) {
      return;
    }

    this.loading = true;
    this.gofiliateService.deactivateSection(section.section_id).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.result) {
          this.toast.success('Section deactivated successfully');
          this.loadData();
        } else {
          this.toast.error(response.message || 'Failed to deactivate section');
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error deactivating section:', error);
        this.toast.error('Failed to deactivate section');
      }
    });
  }

  onDrop(event: CdkDragDrop<NavigationSection[]>): void {
    console.log('Drop event triggered:', event);
    console.log('Previous index:', event.previousIndex, 'Current index:', event.currentIndex);
    
    if (event.previousIndex === event.currentIndex) {
      console.log('No position change, ignoring');
      return; // No change
    }

    // Reorder the array
    moveItemInArray(this.sections, event.previousIndex, event.currentIndex);
    console.log('Reordered sections:', this.sections.map(s => ({ name: s.section_name, order: s.order })));

    // Update order values starting from 1 (not 0)
    this.sections.forEach((section, index) => {
      section.order = index + 1;
    });

    console.log('Updated orders:', this.sections.map(s => ({ name: s.section_name, order: s.order })));

    // Save all updated orders to backend
    this.saveSectionOrders();
  }

  saveSectionOrders(): void {
    const updates = this.sections.map(section => ({
      section_id: section.section_id,
      order: section.order
    }));

    console.log('Sending order updates to backend:', updates);

    this.gofiliateService.updateSectionOrder(updates).subscribe({
      next: (response) => {
        console.log('Order update response:', response);
        this.toast.success('Section order updated successfully');
        
        // Reload data to get the new section IDs created by soft-delete
        this.loading = true;
        this.gofiliateService.getSections().subscribe({
          next: (response) => {
            this.loading = false;
            if (response.result) {
              this.sections = response.sections;
              console.log('Data reloaded');
            }
          },
          error: (error) => {
            this.loading = false;
            console.error('Error reloading sections:', error);
            this.toast.error('Failed to reload sections');
          }
        });
      },
      error: (error) => {
        console.error('Error updating section order:', error);
        this.toast.error('Failed to update section order');
        // Reload to restore original order on error
        this.loadData();
      }
    });
  }
}

