import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { GofiliateService } from '../../../services/gofiliate.service';
import { ToastrService } from 'ngx-toastr';

interface Client {
  client_id: number;
  client_name: string;
  logo_url: string | null;
  created: string;
  updated: string;
  status: number;
}

@Component({
  selector: 'app-client-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-overview.component.html',
  styleUrl: './client-overview.component.scss'
})
export class ClientOverviewComponent implements OnInit {

  public clients: Client[] = [];
  public loading = true;

  constructor(
    private router: Router,
    private gofiliateService: GofiliateService,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading = true;
    this.gofiliateService.getClients().subscribe({
      next: (response: any) => {
        if (response && Array.isArray(response)) {
          this.clients = response.map((item: any) => item.client || item).filter((c: Client) => c.status === 1);
        }
        this.loading = false;
      },
      error: (error) => {
        this.toast.error('Failed to load clients', 'API Error');
        this.loading = false;
        console.error('Error loading clients:', error);
      }
    });
  }

  navigateToClient(clientId: number): void {
    this.router.navigate(['/clients/dashboard', clientId]);
  }

  navigateToOnboarding(): void {
    this.router.navigate(['/clients/details']);
  }
}

