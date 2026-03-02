import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api/api.service';
import { ToastrService } from 'ngx-toastr';
import { ClientCardComponent, Client } from '../client-card/client-card.component';

interface ClientDetail {
  key: string;
  value: string;
}

interface ClientData {
  client: {
    client_id: number;
    client_name: string;
  };
  details: ClientDetail[];
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ClientCardComponent],
  templateUrl: './client-overview.component.html',
  styleUrl: './client-overview.component.scss'
})
export class ClientOverviewComponent implements OnInit {

  public clients: Client[] = [];
  public loading = true;

  constructor(private api: ApiService, private toast: ToastrService) {}

  ngOnInit(): void {
    this.getClients();
  }

  getClients(): void {
    this.loading = true;
    
    this.api.get("/clients", false).subscribe({
      next: (data: ClientData[]) => {
        this.clients = this.transformClients(data);
        this.loading = false;
      },
      error: (error) => {
        this.toast.error('Cannot get clients from the API. Please try again later', 'API Error');
        this.loading = false;
      }
    });
  }

  private transformClients(data: ClientData[]): Client[] {
    return data.map(clientData => ({
      id: clientData.client?.client_id || 0,
      name: clientData.client?.client_name || 'Unnamed Client',
      logo: this.getDetailValue(clientData.details, 'logo') || 'assets/images/default-avatar.png',
      website: this.getDetailValue(clientData.details, 'website') || '#',
      instances: parseInt(this.getDetailValue(clientData.details, 'instances') || '0', 10),
      brands: parseInt(this.getDetailValue(clientData.details, 'brands') || '0', 10),
      onboarding: parseInt(this.getDetailValue(clientData.details, 'onboarding') || '0', 10)
    }));
  }

  private getDetailValue(details: ClientDetail[], key: string): string | undefined {
    const detail = details?.find(d => d.key === key);
    return detail?.value;
  }
}

