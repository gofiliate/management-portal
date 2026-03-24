import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GofiliateService, EmailTemplate } from '../../services/gofiliate.service';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationModalComponent } from '../../components/shared/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-emails',
  standalone: true,
  imports: [CommonModule, ConfirmationModalComponent],
  templateUrl: './emails.component.html',
  styleUrl: './emails.component.scss'
})
export class EmailsComponent implements OnInit {
  emails: EmailTemplate[] = [];
  filteredEmails: EmailTemplate[] = [];
  paginatedEmails: EmailTemplate[] = [];
  loading = false;
  showDeleteModal = false;
  emailToDelete: EmailTemplate | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  // Expose Math for template
  Math = Math;

  constructor(
    private gofiliateService: GofiliateService,
    private router: Router,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    console.log('Emails component initialized');
    this.loadEmails();
  }

  loadEmails(): void {
    this.loading = true;
    this.gofiliateService.getEmailTemplates().subscribe({
      next: (response) => {
        console.log('Email templates loaded:', response);
        if (response.result) {
          // Sort by ID ascending
          this.emails = response.emails.sort((a, b) => a.email_id - b.email_id);
          
          // Debug: Log first email to check email_type value
          if (this.emails.length > 0) {
            console.log('First email sample:', this.emails[0]);
            console.log('email_type value:', this.emails[0].email_type);
            console.log('email_type type:', typeof this.emails[0].email_type);
          }
          
          this.filteredEmails = [...this.emails];
          this.updatePagination();
          this.toast.success(`Loaded ${response.count} email templates`, 'Success');
        } else {
          this.toast.error('Failed to load email templates', 'Error');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading email templates:', error);
        this.toast.error('Failed to load email templates', 'Error');
        this.loading = false;
      }
    });
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredEmails.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedEmails = this.filteredEmails.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  createEmail(): void {
    this.router.navigate(['/gofiliate/emails', 'new']);
  }

  editEmail(email: EmailTemplate): void {
    this.router.navigate(['/gofiliate/emails', email.email_id]);
  }

  deleteEmail(email: EmailTemplate): void {
    this.emailToDelete = email;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.emailToDelete) return;

    this.gofiliateService.deactivateEmailTemplate(this.emailToDelete.email_id).subscribe({
      next: (response) => {
        if (response.code === 200) {
          this.toast.success(response.message || 'Email template deactivated successfully', 'Success');
          this.currentPage = 1; // Reset to first page
          this.loadEmails();
        } else {
          this.toast.error(response.message || 'Failed to deactivate email template', 'Error');
        }
        this.showDeleteModal = false;
        this.emailToDelete = null;
      },
      error: (error) => {
        console.error('Error deactivating email template:', error);
        this.toast.error('Failed to deactivate email template', 'Error');
        this.showDeleteModal = false;
        this.emailToDelete = null;
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.emailToDelete = null;
  }

  getTypeBadgeClass(type: string | null): string {
    switch (type) {
      case 'internal-template':
        return 'bg-primary';
      case 'external-template':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  getTypeLabel(type: string | null): string {
    switch (type) {
      case 'internal-template':
        return 'Internal';
      case 'external-template':
        return 'External';
      default:
        return 'None';
    }
  }
}
