import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GofiliateService, User, Role } from '../../../services/gofiliate.service';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss']
})
export class UserEditComponent implements OnInit {
  userForm!: FormGroup;
  userId: number = 0;
  loading = true;
  roles: Role[] = [];
  profilePicturePreview = '';
  currentUserIsGod = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private gofiliateService: GofiliateService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Check current user's god status from database
    this.authService.checkGodMode().subscribe({
      next: (response) => {
        this.currentUserIsGod = response.is_god;
      },
      error: () => {
        this.currentUserIsGod = false;
      }
    });

    this.route.params.subscribe(params => {
      this.userId = +params['user_id'];
      if (this.userId) {
        this.loadUser();
        this.loadRoles();
      }
    });
  }

  initForm(): void {
    this.userForm = this.fb.group({
      user_id: [0],
      username: ['', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      profile_picture: [''],
      role_id: [null, Validators.required],
      has_managers: [false],
      can_login: [true],
      is_internal: [false],
      is_god: [false],
      status: [true]
    });
  }

  loadUser(): void {
    this.loading = true;
    this.gofiliateService.getUsers().subscribe({
      next: (response: any) => {
        if (!response.error && response.users) {
          const user = response.users.find((u: User) => u.user_id === this.userId);
          if (user) {
            this.userForm.patchValue({
              user_id: user.user_id,
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name,
              profile_picture: user.profile_picture || '',
              role_id: user.role_id || null,
              has_managers: !!user.has_managers,
              can_login: user.can_login !== 0,
              is_internal: !!user.is_internal,
              is_god: !!user.is_god,
              status: user.status === 1
            });
            this.profilePicturePreview = user.profile_picture || '';
          } else {
            this.toastr.error('User not found');
            this.router.navigate(['/gofiliate/users']);
          }
        }
        this.loading = false;
      },
      error: () => {
        this.toastr.error('Failed to load user');
        this.loading = false;
      }
    });
  }

  loadRoles(): void {
    this.gofiliateService.getRoles().subscribe({
      next: (response: any) => {
        if (!response.error && response.roles) {
          this.roles = response.roles;
        }
      },
      error: () => {
        this.toastr.error('Failed to load roles');
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      const saveData = {
        user_id: formValue.user_id,
        username: formValue.username,
        first_name: formValue.first_name,
        last_name: formValue.last_name,
        profile_picture: formValue.profile_picture,
        role_id: formValue.role_id,
        has_managers: formValue.has_managers ? 1 : 0,
        can_login: formValue.can_login ? 1 : 0,
        is_internal: formValue.is_internal ? 1 : 0,
        is_god: this.currentUserIsGod ? (formValue.is_god ? 1 : 0) : 0, // Only send is_god if current user is god
        status: formValue.status ? 1 : 0
      };

      this.gofiliateService.saveUser(saveData).subscribe({
        next: (response: any) => {
          if (!response.error) {
            this.toastr.success('User updated successfully');
          } else {
            this.toastr.error(response.message || 'Failed to update user');
          }
        },
        error: (err) => {
          const errorMsg = err.error?.message || 'Failed to update user';
          this.toastr.error(errorMsg);
        }
      });
    } else {
      this.toastr.warning('Please fill in all required fields');
    }
  }

  onCancel(): void {
    this.router.navigate(['/gofiliate/users']);
  }

  resetPassword(): void {
    this.toastr.info('Password reset functionality coming soon');
  }

  navigateToPoolAccess(): void {
    this.router.navigate(['/gofiliate/users/pool-access', this.userId]);
  }

  get isGod(): boolean {
    return this.currentUserIsGod;
  }

  // Removed pool access methods - now in separate component
}
