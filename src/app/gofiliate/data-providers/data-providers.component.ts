import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GofiliateService, DataProvider } from '../../services/gofiliate.service';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationModalComponent } from '../../components/shared/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-data-providers',
  standalone: true,
  imports: [CommonModule, ConfirmationModalComponent],
  templateUrl: './data-providers.component.html',
  styleUrl: './data-providers.component.scss'
})
export class DataProvidersComponent implements OnInit {
  providers: DataProvider[] = [];
  loading = false;
  showDeleteModal = false;
  providerToDelete: DataProvider | null = null;

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

  navigateToDeleted(): void {
    this.router.navigate(['/gofiliate/data-providers/deleted']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  deleteProvider(provider: DataProvider): void {
    this.providerToDelete = provider;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.providerToDelete) return;

    this.gofiliateService.deleteDataProvider(this.providerToDelete.provider_id).subscribe({
      next: (response) => {
        if (response.result) {
          this.toast.success('Data provider deleted successfully', 'Success');
          this.showDeleteModal = false;
          this.providerToDelete = null;
          // Reload the providers list
          this.loadProviders();
        } else {
          this.toast.error(response.message || 'Failed to delete provider', 'Error');
          this.showDeleteModal = false;
          this.providerToDelete = null;
        }
      },
      error: (error) => {
        console.error('Error deleting provider:', error);
        const errorMessage = error.error?.message || 'Failed to delete provider';
        this.toast.error(errorMessage, 'Error');
        this.showDeleteModal = false;
        this.providerToDelete = null;
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.providerToDelete = null;
  }
}
