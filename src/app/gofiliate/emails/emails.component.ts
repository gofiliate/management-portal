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
  loading = false;
  showDeleteModal = false;
  emailToDelete: EmailTemplate | null = null;

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
          this.emails = response.emails;
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
