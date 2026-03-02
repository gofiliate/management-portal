import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api/api.service';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { InstanceCardComponent, Instance } from '../instance-card/instance-card.component';

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
}

@Component({
  selector: 'app-client-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, InstanceCardComponent],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.scss'
})
export class ClientDashboardComponent implements OnInit {
  
  public instances: Instance[] = [];
  public loading = true;
  public clientId: number = 0;
  public showModal = false;
  public isGod = false;
  public newInstance = {
    instance_name: '',
    client_logo: '',
    hostname: '',
    ip_address: '',
    api_endpoint: '',
    ad_endpoint: '',
    api_key: '',
    jwt_key: '',
    heartbeat_port: undefined as number | undefined,
    is_single_brand: 1,
    is_live: 0
  };

  constructor(
    private api: ApiService, 
    private toast: ToastrService,
    private route: ActivatedRoute,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.isGod = this.auth.isGod();
    this.route.params.subscribe(params => {
      this.clientId = +params['id'];
      this.getInstances();
    });
  }

  getInstances(): void {
    this.loading = true;
    
    this.api.get(`/clients/instances/${this.clientId}`, false).subscribe({
      next: (data: InstanceData[]) => {
        this.instances = this.transformInstances(data);
        this.loading = false;
      },
      error: (error) => {
        this.toast.error('Cannot get instances from the API. Please try again later', 'API Error');
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
      is_live: instanceData.is_live
    }));
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
      api_key: '',
      jwt_key: '',
      heartbeat_port: undefined,
      is_single_brand: 1,
      is_live: 0
    };
  }

  submitInstance(): void {
    // Validate required fields
    if (!this.newInstance.instance_name || !this.newInstance.hostname || 
        !this.newInstance.ip_address || !this.newInstance.api_endpoint) {
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
      heartbeat_port: this.newInstance.heartbeat_port,
      is_single_brand: this.newInstance.is_single_brand,
      is_live: this.newInstance.is_live
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
}
