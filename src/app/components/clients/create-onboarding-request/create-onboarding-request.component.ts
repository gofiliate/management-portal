import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../shared/page-header/page-header.component';
import { GofiliateService } from '../../../services/gofiliate.service';
import { CreateOnboardingRequestRequest, CreateOnboardingRequestSectionDTO } from '../../../models/onboarding.model';

@Component({
  selector: 'app-create-onboarding-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
  templateUrl: './create-onboarding-request.component.html',
  styleUrl: './create-onboarding-request.component.scss'
})
export class CreateOnboardingRequestComponent implements OnInit {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Clients', link: '/clients' },
    { label: 'Onboarding', link: '/clients/onboarding' },
    { label: 'New Request' }
  ];

  currentStep = 1;
  totalSteps = 3;
  isSubmitting = false;

  // Step 1: Company Information
  companyName = '';
  contactEmail = '';
  contactName = '';
  contactPhone = '';
  assignedAdminId: number | null = null;
  
  // Guest user invitation/assignment
  guestInviteMethod: 'new' | 'existing' = 'new';  // Radio button selection
  guestEmail = '';                                // For new guest invitation
  guestUserId: number | null = null;             // For existing guest assignment
  
  // Admin user search
  adminUsers: any[] = [];
  filteredAdminUsers: any[] = [];
  adminSearchTerm = '';
  showAdminDropdown = false;
  selectedAdminName = '';
  
  // Guest user search (for existing guest selection)
  guestUsers: any[] = [];
  filteredGuestUsers: any[] = [];
  guestSearchTerm = '';
  showGuestDropdown = false;
  selectedGuestName = '';

  // Step 2: Sections
  sections: CreateOnboardingRequestSectionDTO[] = [];
  
  // Predefined section templates
  sectionTemplates = [
    {
      section_type: 'company_info',
      section_title: 'Company Details',
      section_description: 'Basic company information including registration, tax details, and business structure',
      is_required: true,
      display_order: 1
    },
    {
      section_type: 'billing_info',
      section_title: 'Banking Information',
      section_description: 'Bank account details for payment processing',
      is_required: true,
      display_order: 2
    },
    {
      section_type: 'technical_contacts',
      section_title: 'Technical Integration',
      section_description: 'API credentials, webhook URLs, and technical configuration',
      is_required: true,
      display_order: 3
    },
    {
      section_type: 'custom',
      section_title: 'Compliance & Legal Documents',
      section_description: 'Upload required licenses, certifications, and legal agreements',
      is_required: false,
      display_order: 4
    },
    {
      section_type: 'custom',
      section_title: 'Brand Assets',
      section_description: 'Company logo, brand guidelines, and marketing materials',
      is_required: false,
      display_order: 5
    },
    {
      section_type: 'custom',
      section_title: 'Payment Terms',
      section_description: 'Commission structure, payment schedule, and financial arrangements',
      is_required: false,
      display_order: 6
    }
  ];

  constructor(
    private gofiliateService: GofiliateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize with all required sections by default
    this.sections = this.sectionTemplates
      .filter(t => t.is_required)
      .map(t => ({ ...t }));
    
    // Load internal users for admin assignment
    this.loadAdminUsers();
    // Load guest users for existing guest assignment
    this.loadGuestUsers();
  }

  loadAdminUsers(): void {
    this.gofiliateService.getUsers().subscribe({
      next: (response) => {
        if (response && response.users) {
          // Filter for internal users only (not guest users)
          this.adminUsers = response.users.filter((u: any) => 
            u.is_internal === true || u.is_internal === 1
          );
          this.filteredAdminUsers = [...this.adminUsers];
        }
      },
      error: (error) => {
        console.error('Error loading admin users:', error);
      }
    });
  }

  filterAdminUsers(): void {
    if (!this.adminSearchTerm.trim()) {
      this.filteredAdminUsers = [...this.adminUsers];
    } else {
      const term = this.adminSearchTerm.toLowerCase();
      this.filteredAdminUsers = this.adminUsers.filter((u: any) => {
        const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
        const username = (u.username || '').toLowerCase();
        const userId = u.user_id?.toString() || '';
        return name.includes(term) || username.includes(term) || userId.includes(term);
      });
    }
  }

  selectAdmin(user: any): void {
    this.assignedAdminId = user.user_id;
    this.selectedAdminName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
    this.adminSearchTerm = this.selectedAdminName;
    this.showAdminDropdown = false;
  }

  clearAdmin(): void {
    this.assignedAdminId = null;
    this.selectedAdminName = '';
    this.adminSearchTerm = '';
    this.filteredAdminUsers = [...this.adminUsers];
  }

  focusAdminSearch(): void {
    this.showAdminDropdown = true;
    this.filterAdminUsers();
  }

  // Guest user methods
  loadGuestUsers(): void {
    this.gofiliateService.getUsers().subscribe({
      next: (response) => {
        if (response && response.users) {
          // Filter for guest users only (is_internal = false/0)
          this.guestUsers = response.users.filter((u: any) => 
            u.is_internal === false || u.is_internal === 0
          );
          this.filteredGuestUsers = [...this.guestUsers];
        }
      },
      error: (error) => {
        console.error('Error loading guest users:', error);
      }
    });
  }

  filterGuestUsers(): void {
    if (!this.guestSearchTerm.trim()) {
      this.filteredGuestUsers = [...this.guestUsers];
    } else {
      const term = this.guestSearchTerm.toLowerCase();
      this.filteredGuestUsers = this.guestUsers.filter((u: any) => {
        const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        const username = (u.username || '').toLowerCase();
        const userId = u.user_id?.toString() || '';
        return name.includes(term) || email.includes(term) || username.includes(term) || userId.includes(term);
      });
    }
  }

  selectGuest(user: any): void {
    this.guestUserId = user.user_id;
    this.selectedGuestName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
    this.guestSearchTerm = this.selectedGuestName;
    this.showGuestDropdown = false;
  }

  clearGuest(): void {
    this.guestUserId = null;
    this.selectedGuestName = '';
    this.guestSearchTerm = '';
    this.filteredGuestUsers = [...this.guestUsers];
  }

  focusGuestSearch(): void {
    this.showGuestDropdown = true;
    this.filterGuestUsers();
  }

  // Navigation
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      if (this.validateCurrentStep()) {
        this.currentStep++;
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step <= this.currentStep || this.validateStepsUpTo(step - 1)) {
      this.currentStep = step;
    }
  }

  // Validation
  validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.validateCompanyInfo();
      case 2:
        return this.validateSections();
      case 3:
        return true;
      default:
        return false;
    }
  }

  validateStepsUpTo(step: number): boolean {
    for (let i = 1; i <= step; i++) {
      const currentStepStore = this.currentStep;
      this.currentStep = i;
      if (!this.validateCurrentStep()) {
        this.currentStep = currentStepStore;
        return false;
      }
      this.currentStep = currentStepStore;
    }
    return true;
  }

  validateCompanyInfo(): boolean {
    return !!this.companyName.trim();
  }

  validateSections(): boolean {
    return this.sections.length > 0 && 
           this.sections.every(s => s.section_title.trim() && s.section_type.trim());
  }

  canProceed(): boolean {
    return this.validateCurrentStep();
  }

  // Section Management
  addSection(template?: any): void {
    const newSection: CreateOnboardingRequestSectionDTO = template ? { ...template } : {
      section_type: '',
      section_title: '',
      section_description: '',
      is_required: false,
      display_order: this.sections.length + 1
    };
    this.sections.push(newSection);
  }

  removeSection(index: number): void {
    this.sections.splice(index, 1);
    this.reorderSections();
  }

  moveSection(index: number, direction: 'up' | 'down'): void {
    if (direction === 'up' && index > 0) {
      [this.sections[index], this.sections[index - 1]] = [this.sections[index - 1], this.sections[index]];
    } else if (direction === 'down' && index < this.sections.length - 1) {
      [this.sections[index], this.sections[index + 1]] = [this.sections[index + 1], this.sections[index]];
    }
    this.reorderSections();
  }

  reorderSections(): void {
    this.sections.forEach((section, index) => {
      section.display_order = index + 1;
    });
  }

  addTemplateSection(template: any): void {
    // Check if this section type already exists
    const exists = this.sections.some(s => s.section_type === template.section_type);
    if (!exists) {
      this.addSection(template);
    }
  }

  isSectionTypeAlreadyAdded(sectionType: string): boolean {
    return this.sections.some(s => s.section_type === sectionType);
  }

  // Submit
  submitRequest(): void {
    if (!this.validateCompanyInfo() || !this.validateSections()) {
      return;
    }

    this.isSubmitting = true;

    const request: CreateOnboardingRequestRequest = {
      company_name_preliminary: this.companyName,
      contact_email: this.contactEmail || undefined,
      contact_name: this.contactName || undefined,
      contact_phone: this.contactPhone || undefined,
      assigned_admin: this.assignedAdminId || undefined,
      sections: this.sections
    };

    // Add guest invitation/assignment based on selection
    if (this.guestInviteMethod === 'new' && this.guestEmail.trim()) {
      request.guest_email = this.guestEmail;
    } else if (this.guestInviteMethod === 'existing' && this.guestUserId) {
      request.guest_user_id = this.guestUserId;
    }

    this.gofiliateService.createOnboardingRequest(request).subscribe({
      next: (response) => {
        console.log('Onboarding request created:', response);
        // Navigate to the request detail page or list
        if (response && response.request_id) {
          this.router.navigate(['/clients/onboarding/requests', response.request_id]);
        } else {
          this.router.navigate(['/clients/onboarding/requests']);
        }
      },
      error: (error) => {
        console.error('Error creating onboarding request:', error);
        this.isSubmitting = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/clients/onboarding']);
  }
}
