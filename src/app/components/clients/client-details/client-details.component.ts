import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
  public activeTab: 'company' | 'accounts' = 'company';
  public loading = false;
  public savingCompanyInfo = false;
  
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
  
  // Accounts
  public userAccounts: UserAccount[] = [];
  public loadingAccounts = false;
  public showAddUserModal = false;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public actionGuard: ActionGuardService,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['client_id']) {
        this.clientId = +params['client_id'];
        this.loadCompanyInfo();
        this.loadUserAccounts();
      }
    });
  }
  
  setActiveTab(tab: 'company' | 'accounts'): void {
    this.activeTab = tab;
  }
  
  loadCompanyInfo(): void {
    this.loading = true;
    // TODO: Implement API call to load company info
    // For now, just set loading to false
    setTimeout(() => {
      this.loading = false;
    }, 500);
  }
  
  saveCompanyInfo(): void {
    this.savingCompanyInfo = true;
    // TODO: Implement API call to save company info
    setTimeout(() => {
      this.savingCompanyInfo = false;
      this.toast.success('Company information saved successfully', 'Success');
    }, 500);
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
