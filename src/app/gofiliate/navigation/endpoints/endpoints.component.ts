import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { GofiliateService, NavigationEndpoint, NavigationSection, SaveEndpointRequest } from '../../../services/gofiliate.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-endpoints',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule, DragDropModule],
  templateUrl: './endpoints.component.html',
  styleUrl: './endpoints.component.scss'
})
export class EndpointsComponent implements OnInit {
  endpoints: NavigationEndpoint[] = [];
  filteredEndpoints: NavigationEndpoint[] = [];
  sections: NavigationSection[] = [];
  loading = false;
  showForm = false;
  editMode = false;
  endpointForm: FormGroup;
  filterSectionId: number | null = null;

  constructor(
    private gofiliateService: GofiliateService,
    private formBuilder: FormBuilder,
    private toast: ToastrService
  ) {
    this.endpointForm = this.formBuilder.group({
      endpoint_id: [null],
      section_id: [null, Validators.required],
      endpoint_name: ['', Validators.required],
      endpoint_description: ['', Validators.required],
      endpoint_slug: ['', Validators.required],
      interface_component: [''],
      order: [0, [Validators.required, Validators.min(0)]],
      in_navigation: [true],
      twofa_required: [false],
      status: [true]
    });
  }

  ngOnInit(): void {
    console.log('Endpoints component initialized');
    console.log('Initial state - loading:', this.loading, 'showForm:', this.showForm, 'endpoints:', this.endpoints.length);
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    console.log('Loading data - loading set to true');
    
    // Load sections first (for dropdown)
    this.gofiliateService.getSections().subscribe({
      next: (response) => {
        console.log('Sections response:', response);
        if (response.result) {
          this.sections = response.sections;
          console.log('Loaded sections:', this.sections.length);
        } else {
          console.warn('Sections response result was false');
        }
        
        // Load endpoints
        this.gofiliateService.getEndpoints().subscribe({
          next: (response) => {
            console.log('Endpoints response:', response);
            this.loading = false;
            console.log('Loading set to false');
            if (response.result) {
              this.endpoints = response.endpoints;
              this.filteredEndpoints = response.endpoints;
              console.log('Loaded endpoints:', this.endpoints.length);
            } else {
              console.warn('Endpoints response result was false');
              this.endpoints = [];
              this.filteredEndpoints = [];
            }
          },
          error: (error) => {
            this.loading = false;
            console.error('Error loading endpoints:', error);
            this.toast.error('Failed to load endpoints. Make sure the backend is running.');
            this.endpoints = [];
            this.filteredEndpoints = [];
          }
        });
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading sections:', error);
        this.filteredEndpoints = [];
      }
    });
  }

  filterBySection(sectionId: number | null): void {
    console.log('Filter by section called with:', sectionId);
    this.filterSectionId = sectionId;
    if (sectionId === null || sectionId === undefined) {
      this.filteredEndpoints = this.endpoints;
      console.log('Showing all endpoints:', this.filteredEndpoints.length);
    } else {
      // Convert to number to handle string values from dropdown
      const numericSectionId = Number(sectionId);
      this.filteredEndpoints = this.endpoints.filter(e => e.section_id === numericSectionId);
      console.log(`Filtered by section ${numericSectionId}: ${this.filteredEndpoints.length} endpoints`);
      console.log('Drag-and-drop enabled:', !!this.filterSectionId);
    }
  }

  getSectionSlug(sectionId: number): string {
    const section = this.sections.find(s => s.section_id === sectionId);
    return section ? section.section_slug : '';
  }

  getSectionName(sectionId: number): string {
    const section = this.sections.find(s => s.section_id === sectionId);
    return section ? section.section_name : 'Unknown';
  }

  getEndpointFullSlug(endpoint: NavigationEndpoint): string {
    // Always construct the full path from section + endpoint slugs
    const sectionSlug = this.getSectionSlug(endpoint.section_id);
    return sectionSlug ? `/${sectionSlug}/${endpoint.endpoint_slug}` : endpoint.endpoint_slug;
  }

  getFullSlug(): string {
    const sectionId = this.endpointForm.get('section_id')?.value;
    const endpointSlug = this.endpointForm.get('endpoint_slug')?.value;
    
    if (sectionId && endpointSlug) {
      const sectionSlug = this.getSectionSlug(sectionId);
      if (sectionSlug) {
        return `/${sectionSlug}/${endpointSlug}`;
      }
    }
    return endpointSlug || '';
  }

  openCreateForm(): void {
    this.editMode = false;
    this.showForm = true;
    this.endpointForm.reset({
      endpoint_id: null,
      section_id: null,
      endpoint_name: '',
      endpoint_description: '',
      endpoint_slug: '',
      interface_component: '',
      order: 0,
      in_navigation: true,
      twofa_required: false,
      status: true
    });
  }

  openEditForm(endpoint: NavigationEndpoint): void {
    this.editMode = true;
    this.showForm = true;
    
    this.endpointForm.patchValue({
      endpoint_id: endpoint.endpoint_id,
      section_id: endpoint.section_id,
      endpoint_name: endpoint.endpoint_name,
      endpoint_description: endpoint.endpoint_description,
      endpoint_slug: endpoint.endpoint_slug,
      interface_component: endpoint.interface_component || '',
      order: endpoint.order,
      in_navigation: endpoint.in_navigation,
      twofa_required: endpoint.twofa_required,
      status: endpoint.status === 1
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.endpointForm.reset();
  }

  saveEndpoint(): void {
    if (this.endpointForm.invalid) {
      this.toast.warning('Please fill all required fields');
      return;
    }

    const formValue = this.endpointForm.value;
    
    // Use just the endpoint slug (not the full path)
    // The backend will construct the full path by concatenating section + endpoint slugs
    const request: SaveEndpointRequest = {
      section_id: Number(formValue.section_id),
      endpoint_name: formValue.endpoint_name,
      endpoint_description: formValue.endpoint_description,
      endpoint_slug: formValue.endpoint_slug,
      interface_component: formValue.interface_component || undefined,
      order: Number(formValue.order),
      in_navigation: formValue.in_navigation,
      twofa_required: formValue.twofa_required,
      status: formValue.status ? 1 : 0
    };

    if (this.editMode && formValue.endpoint_id) {
      request.endpoint_id = Number(formValue.endpoint_id);
    }

    this.loading = true;
    this.gofiliateService.saveEndpoint(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.result) {
          this.toast.success(this.editMode ? 'Endpoint updated successfully' : 'Endpoint created successfully');
          this.showForm = false;
          this.loadData();
        } else {
          this.toast.error(response.message || 'Failed to save endpoint');
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error saving endpoint:', error);
        this.toast.error('Failed to save endpoint');
      }
    });
  }

  deactivateEndpoint(endpoint: NavigationEndpoint): void {
    if (!confirm(`Are you sure you want to deactivate "${endpoint.endpoint_name}"?`)) {
      return;
    }

    this.loading = true;
    this.gofiliateService.deactivateEndpoint(endpoint.endpoint_id).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.result) {
          this.toast.success('Endpoint deactivated successfully');
          this.loadData();
        } else {
          this.toast.error(response.message || 'Failed to deactivate endpoint');
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error deactivating endpoint:', error);
        this.toast.error('Failed to deactivate endpoint');
      }
    });
  }

  onDrop(event: CdkDragDrop<NavigationEndpoint[]>): void {
    console.log('Drop event triggered:', event);
    console.log('Previous index:', event.previousIndex, 'Current index:', event.currentIndex);
    
    if (event.previousIndex === event.currentIndex) {
      console.log('No position change, ignoring');
      return; // No change
    }

    // Reorder the array
    moveItemInArray(this.filteredEndpoints, event.previousIndex, event.currentIndex);
    console.log('Reordered endpoints:', this.filteredEndpoints.map(e => ({ name: e.endpoint_name, order: e.order })));

    // Update order values starting from 1 (not 0)
    this.filteredEndpoints.forEach((endpoint, index) => {
      endpoint.order = index + 1;
    });

    console.log('Updated orders:', this.filteredEndpoints.map(e => ({ name: e.endpoint_name, order: e.order })));

    // Save all updated orders to backend
    this.saveEndpointOrders();
  }

  saveEndpointOrders(): void {
    const updates = this.filteredEndpoints.map(endpoint => ({
      endpoint_id: endpoint.endpoint_id,
      order: endpoint.order
    }));

    console.log('Sending order updates to backend:', updates);

    // Save the current filter state
    const currentFilter = this.filterSectionId;

    this.gofiliateService.updateEndpointOrder(updates).subscribe({
      next: (response) => {
        console.log('Order update response:', response);
        this.toast.success('Endpoint order updated successfully');
        
        // Reload data to get the new endpoint IDs created by soft-delete
        this.loading = true;
        this.gofiliateService.getEndpoints().subscribe({
          next: (response) => {
            this.loading = false;
            if (response.result) {
              this.endpoints = response.endpoints;
              // Re-apply the filter that was active before
              if (currentFilter !== null) {
                this.filterBySection(currentFilter);
              } else {
                this.filteredEndpoints = this.endpoints;
              }
              console.log('Data reloaded and filter re-applied');
            }
          },
          error: (error) => {
            this.loading = false;
            console.error('Error reloading endpoints:', error);
            this.toast.error('Failed to reload endpoints');
          }
        });
      },
      error: (error) => {
        console.error('Error updating endpoint order:', error);
        this.toast.error('Failed to update endpoint order');
        // Reload to restore original order on error
        this.loadData();
      }
    });
  }
}
