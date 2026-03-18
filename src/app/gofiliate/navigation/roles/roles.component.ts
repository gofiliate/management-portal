import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api/api.service';
import { ToastrService } from 'ngx-toastr';

interface Role {
  role_id: number;
  role_name: string;
  role_description: string;
  is_guest: number;
  protected: number;
  status: number;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss'
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  loading = false;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.apiService.get('/gofiliate/roles', false).subscribe({
      next: (response) => {
        if (response.result) {
          this.roles = response.roles || [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load roles:', err);
        this.toastr.error('Failed to load roles');
        this.loading = false;
      }
    });
  }

  editRole(role: Role): void {
    this.router.navigate(['/gofiliate/navigation/roles', role.role_id]);
  }

  createNewRole(): void {
    this.router.navigate(['/gofiliate/navigation/roles', 'new']);
  }

  deleteRole(role: Role): void {
    if (role.protected === 1) {
      this.toastr.warning('Protected roles cannot be deleted');
      return;
    }

    if (!confirm(`Are you sure you want to delete the role "${role.role_name}"?`)) {
      return;
    }

    this.loading = true;
    this.apiService.post('/gofiliate/roles/delete', { role_id: role.role_id }, false).subscribe({
      next: (response) => {
        if (response.result) {
          this.toastr.success('Role deleted successfully');
          this.loadRoles();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to delete role:', err);
        this.toastr.error(err.error?.message || 'Failed to delete role');
        this.loading = false;
      }
    });
  }
}
