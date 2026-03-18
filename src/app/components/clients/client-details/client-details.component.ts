import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api/api.service';
import { ActionGuardService } from '../../../services/action-guard.service';
import { ToastrService } from 'ngx-toastr';

interface CompanyInfo {
  client_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  country: string;
  website: string;
  logo_url: string;
}

interface BillingInfo {
  billing_company_name: string;
  tax_id: string;
  billing_address_line1: string;
  billing_address_line2: string;
  billing_city: string;
  billing_state_province: string;
  billing_postal_code: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  billing_contact_name: string;
  payment_terms: string;
  currency: string;
  purchase_order_required: boolean;
  notes: string;
}

interface UserAccount {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role_name: string;
}

@Component({
  selector: 'app-client-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './client-details.component.html',
  styleUrl: './client-details.component.scss'
})
export class ClientDetailsComponent implements OnInit {
  public clientId?: number;
  public activeTab: 'company' | 'billing' | 'accounts' = 'company';
  public loading = false;
  public savingCompanyInfo = false;
  public savingBillingInfo = false;
  
  // Company Info
  public companyInfo: CompanyInfo = {
    client_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    country: '',
    website: '',
    logo_url: ''
  };
  
  // Billing Info
  public billingInfo: BillingInfo = {
    billing_company_name: '',
    tax_id: '',
    billing_address_line1: '',
    billing_address_line2: '',
    billing_city: '',
    billing_state_province: '',
    billing_postal_code: '',
    billing_country: '',
    billing_email: '',
    billing_phone: '',
    billing_contact_name: '',
    payment_terms: 'NET_30',
    currency: 'USD',
    purchase_order_required: false,
    notes: ''
  };
  
  // Payment terms options
  public paymentTermsOptions = [
    { value: 'IMMEDIATE', label: 'Immediate' },
    { value: 'NET_15', label: 'Net 15 Days' },
    { value: 'NET_30', label: 'Net 30 Days' },
    { value: 'NET_60', label: 'Net 60 Days' },
    { value: 'NET_90', label: 'Net 90 Days' }
  ];
  
  // Accounts
  public userAccounts: UserAccount[] = [];
  public loadingAccounts = false;
  public showAddUserModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    public actionGuard: ActionGuardService,
    private toast: ToastrService
  ) {}

  get isCreating(): boolean {
    return !this.clientId;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['client_id']) {
        this.clientId = +params['client_id'];
        this.loadCompanyInfo();
        this.loadBillingInfo();
        this.loadUserAccounts();
      }
    });
  }
  
  setActiveTab(tab: 'company' | 'billing' | 'accounts'): void {
    this.activeTab = tab;
  }
  
  loadCompanyInfo(): void {
    if (!this.clientId) return;
    
    this.loading = true;
    this.api.get(`/clients/${this.clientId}`, false).subscribe({
      next: (response: any) => {
        if (response) {
          this.companyInfo = {
            client_name: response.client_name || '',
            contact_email: response.contact_email || '',
            contact_phone: response.contact_phone || '',
            address: response.address || '',
            city: response.city || '',
            country: response.country || '',
            website: response.website || '',
            logo_url: response.logo_url || ''
          };
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading company info:', error);
        this.toast.error('Failed to load company information', 'Error');
        this.loading = false;
      }
    });
  }
  
  saveCompanyInfo(): void {
    this.savingCompanyInfo = true;
    
    if (this.isCreating) {
      // Create new client
      this.api.post('/clients', this.companyInfo, false).subscribe({
        next: (response: any) => {
          this.savingCompanyInfo = false;
          this.toast.success('Client created successfully', 'Success');
          // Navigate to the newly created client's details page
          if (response && response.client_id) {
            this.router.navigate(['/clients/details', response.client_id]);
          } else {
            this.router.navigate(['/clients']);
          }
        },
        error: (error) => {
          console.error('Error creating client:', error);
          this.savingCompanyInfo = false;
          this.toast.error('Failed to create client', 'Error');
        }
      });
    } else {
      // Update existing client
      this.api.put(`/clients/${this.clientId}`, this.companyInfo, false).subscribe({
        next: () => {
          this.savingCompanyInfo = false;
          this.toast.success('Company information saved successfully', 'Success');
        },
        error: (error) => {
          console.error('Error saving company info:', error);
          this.savingCompanyInfo = false;
          this.toast.error('Failed to save company information', 'Error');
        }
      });
    }
  }
  
  loadBillingInfo(): void {
    if (!this.clientId) return;
    
    this.loading = true;
    this.api.get(`/clients/${this.clientId}/billing`, false).subscribe({
      next: (response: any) => {
        if (response && response.billing_id) {
          this.billingInfo = {
            billing_company_name: response.billing_company_name || '',
            tax_id: response.tax_id || '',
            billing_address_line1: response.billing_address_line1 || '',
            billing_address_line2: response.billing_address_line2 || '',
            billing_city: response.billing_city || '',
            billing_state_province: response.billing_state_province || '',
            billing_postal_code: response.billing_postal_code || '',
            billing_country: response.billing_country || '',
            billing_email: response.billing_email || '',
            billing_phone: response.billing_phone || '',
            billing_contact_name: response.billing_contact_name || '',
            payment_terms: response.payment_terms || 'NET_30',
            currency: response.currency || 'USD',
            purchase_order_required: response.purchase_order_required || false,
            notes: response.notes || ''
          };
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading billing info:', error);
        this.loading = false;
      }
    });
  }
  
  saveBillingInfo(): void {
    if (!this.clientId) return;
    
    this.savingBillingInfo = true;
    this.api.post(`/clients/${this.clientId}/billing`, this.billingInfo, false).subscribe({
      next: () => {
        this.savingBillingInfo = false;
        this.toast.success('Billing information saved successfully', 'Success');
      },
      error: (error) => {
        console.error('Error saving billing info:', error);
        this.savingBillingInfo = false;
        this.toast.error('Failed to save billing information', 'Error');
      }
    });
  }
  
  loadUserAccounts(): void {
    if (!this.clientId) return;
    
    this.loadingAccounts = true;
    // TODO: Implement API call to load user accounts for this client
    // For now, just set loading to false
    setTimeout(() => {
      this.loadingAccounts = false;
      this.userAccounts = [];
    }, 500);
  }
  
  openAddUserModal(): void {
    this.showAddUserModal = true;
  }
  
  closeAddUserModal(): void {
    this.showAddUserModal = false;
  }
  
  removeUser(userId: number): void {
    if (confirm('Are you sure you want to remove this user from the client?')) {
      // TODO: Implement API call to remove user
      this.toast.success('User removed successfully', 'Success');
      this.loadUserAccounts();
    }
  }
}
