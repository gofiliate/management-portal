import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GofiliateService, DataProvider } from '../../services/gofiliate.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-data-providers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-providers.component.html',
  styleUrl: './data-providers.component.scss'
})
export class DataProvidersComponent implements OnInit {
  providers: DataProvider[] = [];
  loading = false;

  constructor(
    private router: Router,
    private gofiliateService: GofiliateService,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    console.log('Data Providers component initialized');
    this.loadProviders();
  }

  loadProviders(): void {
    this.loading = true;
    this.gofiliateService.getDataProviders().subscribe({
      next: (response) => {
        console.log('Data providers loaded:', response);
        if (response.result) {
          // Sort by name
          this.providers = response.providers.sort((a, b) => 
            a.provider_name.localeCompare(b.provider_name)
          );
          this.toast.success(`Loaded ${response.count} data providers`, 'Success');
        } else {
          this.toast.error('Failed to load data providers', 'Error');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading data providers:', error);
        this.toast.error('Failed to load data providers', 'Error');
        this.loading = false;
      }
    });
  }

  get totalProviders(): number {
    return this.providers.length;
  }

  get activeProviders(): number {
    return this.providers.filter(p => p.status === 1).length;
  }

  navigateToAdd(): void {
    this.router.navigate(['/gofiliate/data-providers/new']);
  }

  navigateToEdit(providerId: number): void {
    this.router.navigate(['/gofiliate/data-providers', providerId]);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
