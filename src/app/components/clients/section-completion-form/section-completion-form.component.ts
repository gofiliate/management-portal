import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../shared/page-header/page-header.component';
import { GofiliateService } from '../../../services/gofiliate.service';
import { OnboardingRequestSection } from '../../../models/onboarding.model';

@Component({
  selector: 'app-section-completion-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
  templateUrl: './section-completion-form.component.html',
  styleUrl: './section-completion-form.component.scss'
})
export class SectionCompletionFormComponent implements OnInit {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Clients', link: '/clients' },
    { label: 'Onboarding', link: '/clients/onboarding' },
    { label: 'Complete Section' }
  ];

  section: OnboardingRequestSection | null = null;
  requestId: number | null = null;
  sectionId: number | null = null;
  isLoading = false;
  isSaving = false;

  // Form data - dynamic based on section type
  formData: { [key: string]: any } = {};

  // Field definitions based on section type
  fieldDefinitions: { [key: string]: SectionField[] } = {
    company_info: [
      { key: 'legal_company_name', label: 'Legal Company Name', type: 'text', required: true },
      { key: 'registration_number', label: 'Registration Number', type: 'text', required: true },
      { key: 'tax_id', label: 'Tax ID', type: 'text', required: true },
      { key: 'incorporation_date', label: 'Incorporation Date', type: 'date', required: true },
      { key: 'business_type', label: 'Business Type', type: 'select', required: true, options: ['Corporation', 'LLC', 'Partnership', 'Sole Proprietorship'] },
      { key: 'address', label: 'Registered Address', type: 'textarea', required: true },
      { key: 'city', label: 'City', type: 'text', required: true },
      { key: 'country', label: 'Country', type: 'text', required: true },
      { key: 'postal_code', label: 'Postal Code', type: 'text', required: true }
    ],
    company_details: [
      { key: 'legal_company_name', label: 'Legal Company Name', type: 'text', required: true },
      { key: 'registration_number', label: 'Registration Number', type: 'text', required: true },
      { key: 'tax_id', label: 'Tax ID', type: 'text', required: true },
      { key: 'incorporation_date', label: 'Incorporation Date', type: 'date', required: true },
      { key: 'business_type', label: 'Business Type', type: 'select', required: true, options: ['Corporation', 'LLC', 'Partnership', 'Sole Proprietorship'] },
      { key: 'address', label: 'Registered Address', type: 'textarea', required: true },
      { key: 'city', label: 'City', type: 'text', required: true },
      { key: 'country', label: 'Country', type: 'text', required: true },
      { key: 'postal_code', label: 'Postal Code', type: 'text', required: true }
    ],
    banking_information: [
      { key: 'bank_name', label: 'Bank Name', type: 'text', required: true },
      { key: 'account_name', label: 'Account Name', type: 'text', required: true },
      { key: 'account_number', label: 'Account Number', type: 'text', required: true },
      { key: 'swift_code', label: 'SWIFT/BIC Code', type: 'text', required: true },
      { key: 'iban', label: 'IBAN', type: 'text', required: false },
      { key: 'bank_address', label: 'Bank Address', type: 'textarea', required: true },
      { key: 'currency', label: 'Currency', type: 'text', required: true }
    ],
    technical_integration: [
      { key: 'api_endpoint', label: 'API Endpoint URL', type: 'url', required: true },
      { key: 'webhook_url', label: 'Webhook URL', type: 'url', required: true },
      { key: 'technical_contact_name', label: 'Technical Contact Name', type: 'text', required: true },
      { key: 'technical_contact_email', label: 'Technical Contact Email', type: 'email', required: true },
      { key: 'technical_contact_phone', label: 'Technical Contact Phone', type: 'tel', required: false },
      { key: 'ip_whitelist', label: 'IP Whitelist (comma separated)', type: 'textarea', required: false },
      { key: 'preferred_format', label: 'Data Format', type: 'select', required: true, options: ['JSON', 'XML'] }
    ],
    compliance_documents: [
      { key: 'gaming_license_number', label: 'Gaming License Number', type: 'text', required: true },
      { key: 'license_jurisdiction', label: 'License Jurisdiction', type: 'text', required: true },
      { key: 'license_expiry', label: 'License Expiry Date', type: 'date', required: true },
      { key: 'compliance_officer_name', label: 'Compliance Officer Name', type: 'text', required: true },
      { key: 'compliance_officer_email', label: 'Compliance Officer Email', type: 'email', required: true },
      { key: 'document_notes', label: 'Additional Notes', type: 'textarea', required: false }
    ],
    brand_assets: [
      { key: 'primary_color', label: 'Primary Brand Color', type: 'color', required: true },
      { key: 'secondary_color', label: 'Secondary Brand Color', type: 'color', required: false },
      { key: 'logo_url', label: 'Logo URL', type: 'url', required: false },
      { key: 'brand_guidelines_url', label: 'Brand Guidelines URL', type: 'url', required: false },
      { key: 'tagline', label: 'Company Tagline', type: 'text', required: false },
      { key: 'brand_notes', label: 'Brand Notes', type: 'textarea', required: false }
    ],
    payment_terms: [
      { key: 'commission_percentage', label: 'Commission Percentage', type: 'number', required: true },
      { key: 'payment_frequency', label: 'Payment Frequency', type: 'select', required: true, options: ['Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly'] },
      { key: 'payment_method', label: 'Payment Method', type: 'select', required: true, options: ['Bank Transfer', 'Wire Transfer', 'PayPal', 'Cryptocurrency'] },
      { key: 'minimum_payout', label: 'Minimum Payout Amount', type: 'number', required: true },
      { key: 'currency', label: 'Currency', type: 'text', required: true },
      { key: 'special_terms', label: 'Special Terms', type: 'textarea', required: false }
    ],
    billing_info: [
      { key: 'billing_company_name', label: 'Billing Company Name', type: 'text', required: true },
      { key: 'billing_address', label: 'Billing Address', type: 'textarea', required: true },
      { key: 'billing_city', label: 'City', type: 'text', required: true },
      { key: 'billing_state', label: 'State/Province', type: 'text', required: false },
      { key: 'billing_postal_code', label: 'Postal Code', type: 'text', required: true },
      { key: 'billing_country', label: 'Country', type: 'text', required: true },
      { key: 'billing_email', label: 'Billing Email', type: 'email', required: true },
      { key: 'billing_phone', label: 'Billing Phone', type: 'tel', required: true },
      { key: 'tax_id', label: 'Tax ID / VAT Number', type: 'text', required: false },
      { key: 'billing_notes', label: 'Additional Billing Notes', type: 'textarea', required: false }
    ],
    technical_contacts: [
      { key: 'primary_tech_name', label: 'Primary Technical Contact Name', type: 'text', required: true },
      { key: 'primary_tech_email', label: 'Primary Technical Contact Email', type: 'email', required: true },
      { key: 'primary_tech_phone', label: 'Primary Technical Contact Phone', type: 'tel', required: true },
      { key: 'primary_tech_role', label: 'Primary Contact Role', type: 'text', required: false },
      { key: 'secondary_tech_name', label: 'Secondary Technical Contact Name', type: 'text', required: false },
      { key: 'secondary_tech_email', label: 'Secondary Technical Contact Email', type: 'email', required: false },
      { key: 'secondary_tech_phone', label: 'Secondary Technical Contact Phone', type: 'tel', required: false },
      { key: 'secondary_tech_role', label: 'Secondary Contact Role', type: 'text', required: false },
      { key: 'emergency_contact', label: 'Emergency Contact Number', type: 'tel', required: false },
      { key: 'preferred_contact_method', label: 'Preferred Contact Method', type: 'select', required: true, options: ['Email', 'Phone', 'Slack', 'Teams'] },
      { key: 'timezone', label: 'Timezone', type: 'text', required: false },
      { key: 'availability_notes', label: 'Availability Notes', type: 'textarea', required: false }
    ],
    custom: [
      { key: 'title', label: 'Title', type: 'text', required: false },
      { key: 'description', label: 'Description', type: 'textarea', required: false },
      { key: 'value', label: 'Value', type: 'text', required: false },
      { key: 'notes', label: 'Notes', type: 'textarea', required: false }
    ]
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gofiliateService: GofiliateService
  ) {}

  ngOnInit(): void {
    this.sectionId = parseInt(this.route.snapshot.paramMap.get('sectionId') || '0');

    if (this.sectionId) {
      this.loadSection();
    }
  }

  loadSection(): void {
    if (!this.sectionId) return;

    this.isLoading = true;
    // First, load the section to get its request_id
    this.gofiliateService.getOnboardingSection(this.sectionId).subscribe({
      next: (section) => {
        if (section && section.request_id) {
          this.requestId = section.request_id;
          this.section = section;
          this.breadcrumbs[2].label = section.section_title;
          
          // Load existing data if any
          if (section.section_data) {
            this.formData = typeof section.section_data === 'string' 
              ? JSON.parse(section.section_data) 
              : section.section_data;
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading section:', error);
        this.section = null;
        this.isLoading = false;
      }
    });
  }

  getFields(): SectionField[] {
    if (!this.section) return [];
    return this.fieldDefinitions[this.section.section_type] || [];
  }

  isFormValid(): boolean {
    const fields = this.getFields();
    return fields
      .filter(f => f.required)
      .every(f => this.formData[f.key] && String(this.formData[f.key]).trim());
  }

  saveProgress(): void {
    if (!this.requestId || !this.sectionId) return;

    this.isSaving = true;
    const updateData = {
      section_data: this.formData,
      status: 'in_progress'
    };

    this.gofiliateService.updateSection(this.requestId, this.sectionId, updateData).subscribe({
      next: () => {
        console.log('Progress saved');
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error saving progress:', error);
        this.isSaving = false;
      }
    });
  }

  submitSection(): void {
    if (!this.isFormValid() || !this.requestId || !this.sectionId) return;

    this.isSaving = true;
    const updateData = {
      section_data: this.formData,
      status: 'completed'
    };

    this.gofiliateService.updateSection(this.requestId, this.sectionId, updateData).subscribe({
      next: () => {
        console.log('Section completed');
        this.router.navigate(['/clients/onboarding/requests', this.requestId]);
      },
      error: (error) => {
        console.error('Error submitting section:', error);
        this.isSaving = false;
      }
    });
  }

  cancel(): void {
    if (this.requestId) {
      this.router.navigate(['/clients/onboarding/requests', this.requestId]);
    } else {
      this.router.navigate(['/clients/onboarding']);
    }
  }
}

interface SectionField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'number' | 'date' | 'color' | 'textarea' | 'select';
  required: boolean;
  options?: string[];
}
