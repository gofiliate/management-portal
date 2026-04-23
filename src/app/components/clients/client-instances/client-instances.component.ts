import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api/api.service';
import { AuthService } from '../../../services/auth.service';
import { ActionGuardService } from '../../../services/action-guard.service';
import { ToastrService } from 'ngx-toastr';
import { InstanceCardComponent, Instance } from '../instance-card/instance-card.component';
import { GofiliateService, DataProvider } from '../../../services/gofiliate.service';

interface InstanceData {
  instance_id: number;
  instance_name: string;
  client_logo?: string;
  api_endpoint: string;
  api_key: string;
  ad_endpoint?: string;
  ip_address?: string;
  heartbeat_port?: number;
  is_single_brand?: number;
  is_live?: number;
  status: number;
  is_public?: number;
}

@Component({
  selector: 'app-client-instances',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, InstanceCardComponent],
  templateUrl: './client-instances.component.html',
  styleUrl: './client-instances.component.scss'
})
export class ClientInstancesComponent implements OnInit {

  public instances: Instance[] = [];
  public loading = true;
  public clientId: number = 0;
  public showModal = false;
  public isGod = false;
  public providers: DataProvider[] = [];
  public newInstance = {
    instance_name: '',
    client_logo: '',
    hostname: '',
    ip_address: '',
    api_endpoint: '',
    ad_endpoint: '',
    aff_endpoint: '',
    admin_endpoint: '',
    api_key: '',
    jwt_key: '',
    heartbeat_port: undefined as number | undefined,
    is_single_brand: 1,
    is_live: 0,
    is_public: 0,
    data_provider_id: undefined as number | undefined,
    data_provider_key: ''
  };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    public actionGuard: ActionGuardService,
    private toast: ToastrService,
    private route: ActivatedRoute,
    private gofiliateService: GofiliateService
  ) {}

  ngOnInit(): void {
    this.isGod = this.auth.isGod();
    this.loadProviders();
    this.route.params.subscribe(params => {
      this.clientId = +params['id'];
      this.getInstances();
    });
  }

  loadProviders(): void {
    this.gofiliateService.getDataProviders().subscribe({
      next: (response) => {
        this.providers = response.providers.filter(p => !p.deleted_at);
      },
      error: (error) => {
        console.error('Error loading data providers:', error);
      }
    });
  }

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.newInstance = {
      instance_name: '',
      client_logo: '',
      hostname: '',
      ip_address: '',
      api_endpoint: '',
      ad_endpoint: '',
      aff_endpoint: '',
      admin_endpoint: '',
      api_key: '',
      jwt_key: '',
      heartbeat_port: undefined,
      is_single_brand: 1,
      is_live: 0,
      is_public: 0,
      data_provider_id: undefined,
      data_provider_key: ''
    };
  }

  submitInstance(): void {
    // Validate required fields
    if (!this.newInstance.instance_name || !this.newInstance.hostname || 
        !this.newInstance.ip_address || !this.newInstance.api_endpoint ||
        !this.newInstance.aff_endpoint || !this.newInstance.admin_endpoint) {
      this.toast.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    // Only GODs need to validate api_key
    if (this.isGod && !this.newInstance.api_key) {
      this.toast.error('API Key is required', 'Validation Error');
      return;
    }

    const payload: any = {
      client_id: this.clientId,
      action: 'create',
      instance_name: this.newInstance.instance_name,
      client_logo: this.newInstance.client_logo,
      hostname: this.newInstance.hostname,
      ip_address: this.newInstance.ip_address,
      api_endpoint: this.newInstance.api_endpoint,
      ad_endpoint: this.newInstance.ad_endpoint,
      aff_endpoint: this.newInstance.aff_endpoint,
      admin_endpoint: this.newInstance.admin_endpoint,
      heartbeat_port: this.newInstance.heartbeat_port,
      is_single_brand: this.newInstance.is_single_brand,
      is_live: this.newInstance.is_live,
      is_public: this.isGod ? this.newInstance.is_public : 0,
      data_provider_id: this.newInstance.data_provider_id || null,
      data_provider_key: this.newInstance.data_provider_key || null
    };

    // Only GODs can send api_key and jwt_key, non-GODs send KEY_NEEDED
    if (this.isGod) {
      payload.api_key = this.newInstance.api_key;
      payload.jwt_key = this.newInstance.jwt_key || null;
    } else {
      payload.api_key = 'KEY_NEEDED';
      payload.jwt_key = null;
    }

    this.api.post('/clients/instance', payload, false).subscribe({
      next: (response) => {
        this.toast.success('Instance added successfully', 'Success');
        this.closeModal();
        this.getInstances(); // Refresh the list
      },
      error: (error) => {
        this.toast.error('Failed to add instance. Please try again.', 'API Error');
        console.error('Error adding instance:', error);
      }
    });
  }

  get totalInstances(): number {
    return this.instances.length;
  }

  get liveInstances(): number {
    return this.instances.filter(i => i.is_live === 1).length;
  }

  get devInstances(): number {
    return this.instances.filter(i => i.is_live !== 1).length;
  }

  get activeInstances(): number {
    return this.instances.filter(i => i.active).length;
  }

  getInstances(): void {
    this.loading = true;
    
    this.api.get(`/clients/instances/${this.clientId}`, false).subscribe({
      next: (data: InstanceData[] | null) => {
        // Handle null/undefined response gracefully
        if (data && Array.isArray(data)) {
          this.instances = this.transformInstances(data);
        } else {
          this.instances = [];
        }
        this.loading = false;
      },
      error: (error) => {
        this.toast.error('Cannot get instances from the API. Please try again later', 'API Error');
        this.instances = [];
        this.loading = false;
      }
    });
  }

  private transformInstances(data: InstanceData[]): Instance[] {
    return data.map(instanceData => ({
      id: instanceData.instance_id || 0,
      name: instanceData.instance_name || 'Unnamed Instance',
      logo: instanceData.client_logo && instanceData.client_logo.trim() !== '' 
        ? instanceData.client_logo 
        : undefined,
      url: undefined,
      active: instanceData.status === 1,
      api_endpoint: instanceData.api_endpoint,
      api_key: instanceData.api_key,
      ad_endpoint: instanceData.ad_endpoint,
      ip_address: instanceData.ip_address,
      heartbeat_port: instanceData.heartbeat_port,
      is_live: instanceData.is_live,
      is_public: instanceData.is_public
    }));
  }
}
