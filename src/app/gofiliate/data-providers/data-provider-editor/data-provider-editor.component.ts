import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GofiliateService, DataProvider, DataProviderTable } from '../../../services/gofiliate.service';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationModalComponent } from '../../../components/shared/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-data-provider-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmationModalComponent],
  templateUrl: './data-provider-editor.component.html',
  styleUrl: './data-provider-editor.component.scss'
})
export class DataProviderEditorComponent implements OnInit {
  providerForm!: FormGroup;
  tableForm!: FormGroup;
  providerId: number | null = null;
  loading = true;
  saving = false;
  isNewProvider = false;

  // Delete functionality
  showDeleteModal = false;

  // Tables management
  tables: DataProviderTable[] = [];
  loadingTables = false;
  showTableForm = false;
  editingTable: DataProviderTable | null = null;
  savingTable = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private gofiliateService: GofiliateService,
    private toast: ToastrService
  ) {
    this.initForm();
    this.initTableForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id === 'new') {
        this.isNewProvider = true;
        this.loading = false;
      } else {
        this.providerId = +id;
        this.loadProvider();
      }
    });
  }

  initForm(): void {
    this.providerForm = this.fb.group({
      provider_id: [null],
      provider_name: ['', [Validators.required, Validators.maxLength(64)]],
      provider_url: ['', [Validators.required, Validators.maxLength(255)]],
      status: [1, Validators.required]
    });
  }

  loadProvider(): void {
    if (this.providerId === null) return;

    this.loading = true;
    this.gofiliateService.getDataProviders().subscribe({
      next: (response) => {
        if (response.result) {
          const provider = response.providers.find(p => p.provider_id === this.providerId);
          if (provider) {
            this.providerForm.patchValue({
              provider_id: provider.provider_id,
              provider_name: provider.provider_name,
              provider_url: provider.provider_url,
              status: provider.status
            });
            // Load tables for this provider
            this.loadTables();
          } else {
            this.toast.error('Provider not found', 'Error');
            this.router.navigate(['/gofiliate/data-providers']);
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading provider:', error);
        this.toast.error('Failed to load provider', 'Error');
        this.loading = false;
        this.router.navigate(['/gofiliate/data-providers']);
      }
    });
  }

  onSubmit(): void {
    if (this.providerForm.invalid) {
      Object.keys(this.providerForm.controls).forEach(key => {
        this.providerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.saving = true;
    const formValue = this.providerForm.value;

    if (this.isNewProvider) {
      // Create new provider
      this.gofiliateService.createDataProvider(formValue).subscribe({
        next: (response) => {
          if (response.result) {
            this.toast.success('Data provider created successfully', 'Success');
            this.router.navigate(['/gofiliate/data-providers']);
          } else {
            this.toast.error(response.message || 'Failed to create provider', 'Error');
          }
          this.saving = false;
        },
        error: (error) => {
          console.error('Error creating provider:', error);
          this.toast.error('Failed to create provider', 'Error');
          this.saving = false;
        }
      });
    } else {
      // Update existing provider
      this.gofiliateService.updateDataProvider(formValue.provider_id, formValue).subscribe({
        next: (response) => {
          if (response.result) {
            this.toast.success('Data provider updated successfully', 'Success');
            this.router.navigate(['/gofiliate/data-providers']);
          } else {
            this.toast.error(response.message || 'Failed to update provider', 'Error');
          }
          this.saving = false;
        },
        error: (error) => {
          console.error('Error updating provider:', error);
          this.toast.error('Failed to update provider', 'Error');
          this.saving = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/gofiliate/data-providers']);
  }

  // Delete provider methods
  deleteProvider(): void {
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.providerId) return;

    this.gofiliateService.deleteDataProvider(this.providerId).subscribe({
      next: (response) => {
        if (response.result) {
          this.toast.success('Data provider deleted successfully', 'Success');
          this.showDeleteModal = false;
          this.router.navigate(['/gofiliate/data-providers']);
        } else {
          this.toast.error(response.message || 'Failed to delete provider', 'Error');
          this.showDeleteModal = false;
        }
      },
      error: (error) => {
        console.error('Error deleting provider:', error);
        const errorMessage = error.error?.message || 'Failed to delete provider';
        this.toast.error(errorMessage, 'Error');
        this.showDeleteModal = false;
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
  }

  // Table Form Methods
  initTableForm(): void {
    this.tableForm = this.fb.group({
      table_id: [null],
      table_description: ['', [Validators.required, Validators.maxLength(255)]],
      table_player_alias: ['', Validators.maxLength(32)],
      table_prefix: ['', [Validators.required, Validators.maxLength(4)]],
      table_name: ['', [Validators.required, Validators.maxLength(128)]],
      table_player_field: ['', [Validators.required, Validators.maxLength(32)]],
      table_date_field: ['', [Validators.required, Validators.maxLength(32)]],
      date_format: ['date', Validators.required],
      table_join_to_main: ['', [Validators.required, Validators.maxLength(128)]],
      table_grouping: ['', [Validators.required, Validators.maxLength(64)]],
      multi_currency: ['no', Validators.required],
      multi_currency_field: ['', Validators.maxLength(32)],
      table_sql: ['', Validators.required],
      auto_register_table: [1, Validators.required],
      status: [1, Validators.required]
    });
  }

  loadTables(): void {
    if (this.providerId === null) return;

    this.loadingTables = true;
    this.gofiliateService.getDataProviderTables(this.providerId).subscribe({
      next: (response) => {
        if (response.result) {
          this.tables = response.tables;
        }
        this.loadingTables = false;
      },
      error: (error) => {
        console.error('Error loading tables:', error);
        this.toast.error('Failed to load tables', 'Error');
        this.loadingTables = false;
      }
    });
  }

  openTableForm(table?: DataProviderTable): void {
    this.editingTable = table || null;
    this.showTableForm = true;

    if (table) {
      this.tableForm.patchValue(table);
    } else {
      this.tableForm.reset({
        table_id: null,
        date_format: 'date',
        multi_currency: 'no',
        auto_register_table: 1,
        status: 1
      });
    }
  }

  closeTableForm(): void {
    this.showTableForm = false;
    this.editingTable = null;
    this.tableForm.reset();
  }

  onSubmitTable(): void {
    if (this.tableForm.invalid || this.providerId === null) {
      Object.keys(this.tableForm.controls).forEach(key => {
        this.tableForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.savingTable = true;
    const formValue = this.tableForm.value;

    if (this.editingTable) {
      // Update existing table
      this.gofiliateService.updateDataProviderTable(this.providerId, formValue.table_id, formValue).subscribe({
        next: (response) => {
          if (response.result) {
            this.toast.success('Table updated successfully', 'Success');
            this.closeTableForm();
            this.loadTables();
          } else {
            this.toast.error(response.message || 'Failed to update table', 'Error');
          }
          this.savingTable = false;
        },
        error: (error) => {
          console.error('Error updating table:', error);
          this.toast.error('Failed to update table', 'Error');
          this.savingTable = false;
        }
      });
    } else {
      // Create new table
      this.gofiliateService.createDataProviderTable(this.providerId, formValue).subscribe({
        next: (response) => {
          if (response.result) {
            this.toast.success('Table created successfully', 'Success');
            this.closeTableForm();
            this.loadTables();
          } else {
            this.toast.error(response.message || 'Failed to create table', 'Error');
          }
          this.savingTable = false;
        },
        error: (error) => {
          console.error('Error creating table:', error);
          this.toast.error('Failed to create table', 'Error');
          this.savingTable = false;
        }
      });
    }
  }

  deleteTable(table: DataProviderTable): void {
    if (!confirm(`Are you sure you want to delete "${table.table_description}"?`)) {
      return;
    }

    if (this.providerId === null) return;

    this.gofiliateService.deleteDataProviderTable(this.providerId, table.table_id).subscribe({
      next: (response) => {
        if (response.result) {
          this.toast.success('Table deleted successfully', 'Success');
          this.loadTables();
        } else {
          this.toast.error(response.message || 'Failed to delete table', 'Error');
        }
      },
      error: (error) => {
        console.error('Error deleting table:', error);
        this.toast.error('Failed to delete table', 'Error');
      }
    });
  }
}
