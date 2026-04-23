import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GofiliateService, User, Role, UserInvitation } from '../../services/gofiliate.service';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationModalComponent } from '../../components/shared/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmationModalComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  invitations: UserInvitation[] = [];
  roles: Role[] = [];
  loading = false;
  loadingInvitations = false;
  showInviteModal = false;
  inviteForm!: FormGroup;
  
  // Delete modal
  showDeleteModal = false;
  userToDelete: User | null = null;
  
  // Pagination for users
  userPage = 1;
  userPageSize = 10;
  
  // Pagination for invitations
  invitationPage = 1;
  invitationPageSize = 10;
  
  // Active tab for invitations (pending or expired)
  activeInvitationTab: 'pending' | 'expired' = 'pending';

  constructor(
    private gofiliateService: GofiliateService,
    private router: Router,
    private toast: ToastrService,
    private fb: FormBuilder
  ) {
    this.initInviteForm();
  }

  ngOnInit(): void {
    console.log('Users component initialized');
    this.loadUsers();
    this.loadInvitations();
    this.loadRoles();
  }

  initInviteForm(): void {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      given_name: ['', [Validators.required, Validators.maxLength(100)]],
      role_id: [null, Validators.required]
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.gofiliateService.getUsers().subscribe({
      next: (response) => {
        console.log('Users loaded:', response);
        if (response.result) {
          this.users = response.users;
          this.toast.success(`Loaded ${response.count} users`, 'Success');
        } else {
          this.toast.error('Failed to load users', 'Error');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.toast.error('Failed to load users', 'Error');
        this.loading = false;
      }
    });
  }



  getStatusBadge(status: number): string {
    return status === 1 ? 'bg-success' : 'bg-danger';
  }

  getStatusText(status: number): string {
    return status === 1 ? 'Active' : 'Inactive';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  editUser(user: User): void {
    this.router.navigate(['/gofiliate/users', user.user_id]);
  }

  resetPassword(user: User): void {
    this.toast.info('Password reset functionality coming soon');
  }

  loadInvitations(): void {
    this.loadingInvitations = true;
    this.gofiliateService.getUserInvitations().subscribe({
      next: (response) => {
        console.log('Invitations loaded:', response);
        if (response.result) {
          this.invitations = response.invitations;
        } else {
          this.toast.error('Failed to load invitations', 'Error');
        }
        this.loadingInvitations = false;
      },
      error: (error) => {
        console.error('Error loading invitations:', error);
        this.toast.error('Failed to load invitations', 'Error');
        this.loadingInvitations = false;
      }
    });
  }

  loadRoles(): void {
    this.gofiliateService.getRoles().subscribe({
      next: (response) => {
        if (response.result) {
          this.roles = response.roles;
        }
      },
      error: (error) => {
        console.error('Error loading roles:', error);
      }
    });
  }

  openInviteModal(): void {
    this.inviteForm.reset();
    this.showInviteModal = true;
  }

  closeInviteModal(): void {
    this.showInviteModal = false;
    this.inviteForm.reset();
  }

  submitInvitation(): void {
    if (this.inviteForm.invalid) {
      this.toast.warning('Please fill in all required fields correctly');
      return;
    }

    const formData = this.inviteForm.value;
    
    this.gofiliateService.sendUserInvitation(formData).subscribe({
      next: (response) => {
        if (response.code === 200) {
          this.toast.success(response.message || 'Invitation sent successfully', 'Success');
          this.closeInviteModal();
          this.loadInvitations();
        } else {
          this.toast.error(response.message || 'Failed to send invitation', 'Error');
        }
      },
      error: (error) => {
        console.error('Error sending invitation:', error);
        this.toast.error('Failed to send invitation', 'Error');
      }
    });
  }

  // Pagination helpers for users
  get paginatedUsers(): User[] {
    const start = (this.userPage - 1) * this.userPageSize;
    return this.users.slice(start, start + this.userPageSize);
  }

  get userTotalPages(): number {
    return Math.ceil(this.users.length / this.userPageSize);
  }

  get userPages(): number[] {
    return Array.from({ length: this.userTotalPages }, (_, i) => i + 1);
  }

  // Filter invitations by status
  get pendingInvitations(): UserInvitation[] {
    return this.invitations.filter(inv => 
      inv.accepted !== 1 && new Date(inv.expires_at) >= new Date()
    );
  }

  get expiredInvitations(): UserInvitation[] {
    return this.invitations.filter(inv => 
      inv.accepted !== 1 && new Date(inv.expires_at) < new Date()
    );
  }

  get filteredInvitations(): UserInvitation[] {
    return this.activeInvitationTab === 'pending' ? this.pendingInvitations : this.expiredInvitations;
  }

  // Pagination helpers for invitations
  get paginatedInvitations(): UserInvitation[] {
    const filtered = this.filteredInvitations;
    const start = (this.invitationPage - 1) * this.invitationPageSize;
    return filtered.slice(start, start + this.invitationPageSize);
  }

  get invitationTotalPages(): number {
    return Math.ceil(this.filteredInvitations.length / this.invitationPageSize);
  }

  get invitationPages(): number[] {
    return Array.from({ length: this.invitationTotalPages }, (_, i) => i + 1);
  }

  setInvitationTab(tab: 'pending' | 'expired'): void {
    this.activeInvitationTab = tab;
    this.invitationPage = 1; // Reset to first page when switching tabs
  }

  getInvitationStatusBadge(accepted: number, expiresAt: string): string {
    if (accepted === 1) return 'bg-success';
    if (new Date(expiresAt) < new Date()) return 'bg-danger';
    return 'bg-warning';
  }

  getInvitationStatusText(accepted: number, expiresAt: string): string {
    if (accepted === 1) return 'Accepted';
    if (new Date(expiresAt) < new Date()) return 'Expired';
    return 'Pending';
  }

  deleteUser(user: User): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.userToDelete) return;

    this.gofiliateService.deleteUser(this.userToDelete.user_id).subscribe({
      next: (response) => {
        this.toast.success('User deleted successfully', 'Success');
        this.showDeleteModal = false;
        this.userToDelete = null;
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.toast.error(error.error?.message || 'Failed to delete user', 'Error');
        this.showDeleteModal = false;
        this.userToDelete = null;
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  navigateToDeleted(): void {
    this.router.navigate(['/gofiliate/users/deleted']);
  }
}
