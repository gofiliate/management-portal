import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GofiliateService, DataProvider } from '../../../services/gofiliate.service';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationModalComponent } from '../../../components/shared/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-deleted-data-providers',
  standalone: true,
  imports: [CommonModule, ConfirmationModalComponent],
  templateUrl: './deleted-data-providers.component.html',
  styleUrl: './deleted-data-providers.component.scss'
})
export class DeletedDataProvidersComponent implements OnInit {
  deletedProviders: DataProvider[] = [];
  loading = false;
  showRestoreModal = false;
  providerToRestore: DataProvider | null = null;

  constructor(
    private router: Router,
    private gofiliateService: GofiliateService,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    console.log('Deleted Data Providers component initialized');
    this.loadDeletedProviders();
  }

  loadDeletedProviders(): void {
    this.loading = true;
    this.gofiliateService.getDeletedDataProviders().subscribe({
      next: (response) => {
        console.log('Deleted providers loaded:', response);
        if (response.result) {
          // Filter only deleted providers and sort by name
          this.deletedProviders = response.providers
            .filter(p => p.deleted_at !== null && p.deleted_at !== undefined)
            .sort((a, b) => a.provider_name.localeCompare(b.provider_name));
          
          if (this.deletedProviders.length === 0) {
            this.toast.info('No deleted providers found', 'Info');
          } else {
            this.toast.success(`Loaded ${this.deletedProviders.length} deleted provider(s)`, 'Success');
          }
        } else {
          this.toast.error('Failed to load deleted providers', 'Error');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading deleted providers:', error);
        this.toast.error('Failed to load deleted providers', 'Error');
        this.loading = false;
      }
    });
  }

  restoreProvider(provider: DataProvider): void {
    this.providerToRestore = provider;
    this.showRestoreModal = true;
  }

  confirmRestore(): void {
    if (!this.providerToRestore) return;

    this.gofiliateService.restoreDataProvider(this.providerToRestore.provider_id).subscribe({
      next: (response) => {
        if (response.result) {
          this.toast.success('Data provider restored successfully', 'Success');
          this.showRestoreModal = false;
          this.providerToRestore = null;
          // Reload the deleted providers list
          this.loadDeletedProviders();
        } else {
          this.toast.error(response.message || 'Failed to restore provider', 'Error');
          this.showRestoreModal = false;
          this.providerToRestore = null;
        }
      },
      error: (error) => {
        console.error('Error restoring provider:', error);
        const errorMessage = error.error?.message || 'Failed to restore provider';
        this.toast.error(errorMessage, 'Error');
        this.showRestoreModal = false;
        this.providerToRestore = null;
      }
    });
  }

  cancelRestore(): void {
    this.showRestoreModal = false;
    this.providerToRestore = null;
  }

  backToList(): void {
    this.router.navigate(['/gofiliate/data-providers']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
