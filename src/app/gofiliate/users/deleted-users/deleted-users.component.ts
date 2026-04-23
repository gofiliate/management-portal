import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GofiliateService, User } from '../../../services/gofiliate.service';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationModalComponent } from '../../../components/shared/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-deleted-users',
  standalone: true,
  imports: [CommonModule, ConfirmationModalComponent],
  templateUrl: './deleted-users.component.html',
  styleUrl: './deleted-users.component.scss'
})
export class DeletedUsersComponent implements OnInit {
  users: User[] = [];
  loading = false;
  
  // Restore modal
  showRestoreModal = false;
  userToRestore: User | null = null;
  
  // Pagination
  page = 1;
  pageSize = 10;

  constructor(
    private gofiliateService: GofiliateService,
    private router: Router,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    console.log('Deleted users component initialized');
    this.loadDeletedUsers();
  }

  loadDeletedUsers(): void {
    this.loading = true;
    this.gofiliateService.getDeletedUsers().subscribe({
      next: (response) => {
        console.log('Deleted users loaded:', response);
        if (response.result) {
          this.users = response.users;
          this.toast.success(`Loaded ${response.count} deleted users`, 'Success');
        } else {
          this.toast.error('Failed to load deleted users', 'Error');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading deleted users:', error);
        this.toast.error('Failed to load deleted users', 'Error');
        this.loading = false;
      }
    });
  }

  restoreUser(user: User): void {
    this.userToRestore = user;
    this.showRestoreModal = true;
  }

  confirmRestore(): void {
    if (!this.userToRestore) return;

    this.gofiliateService.restoreUser(this.userToRestore.user_id).subscribe({
      next: (response) => {
        this.toast.success('User restored successfully', 'Success');
        this.showRestoreModal = false;
        this.userToRestore = null;
        this.loadDeletedUsers();
      },
      error: (error) => {
        console.error('Error restoring user:', error);
        this.toast.error(error.error?.message || 'Failed to restore user', 'Error');
        this.showRestoreModal = false;
        this.userToRestore = null;
      }
    });
  }

  cancelRestore(): void {
    this.showRestoreModal = false;
    this.userToRestore = null;
  }

  navigateToUsers(): void {
    this.router.navigate(['/gofiliate/users']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  getStatusBadge(status: number): string {
    return status === 1 ? 'bg-success' : 'bg-danger';
  }

  getStatusText(status: number): string {
    return status === 1 ? 'Active' : 'Inactive';
  }

  // Pagination helpers
  get paginatedUsers(): User[] {
    const start = (this.page - 1) * this.pageSize;
    return this.users.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.users.length / this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
