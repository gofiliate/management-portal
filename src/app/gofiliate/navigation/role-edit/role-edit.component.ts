import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../services/api/api.service';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

interface Role {
  role_id: number;
  role_name: string;
  role_description: string;
  protected: number;
  status: number;
}

interface NavigationSection {
  section_id: number;
  section_name: string;
  section_icon: string;
}

interface NavigationEndpoint {
  endpoint_id: number;
  section_id: number;
  endpoint_name: string;
  endpoint_description: string;
  in_navigation: boolean;
}

interface Action {
  action_id: number;
  action_name: string;
}

interface RolePermission {
  role_id: number;
  endpoint_id: number;
  section_id: number;
  action_id: number;
}

@Component({
  selector: 'app-role-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-edit.component.html',
  styleUrl: './role-edit.component.scss'
})
export class RoleEditComponent implements OnInit {
  loading = false;
  roleId: number | null = null;
  activeTab = 0;
  currentUserIsGod = false;

  // Data
  role: Role | null = null;
  sections: NavigationSection[] = [];
  endpoints: NavigationEndpoint[] = [];
  availableActions: Action[] = [];
  enabledActions: RolePermission[] = [];

  // Form model
  roleForm = {
    role_id: 0,
    role_name: '',
    role_description: '',
    protected: 0,
    status: 1
  };

  // Permission checkboxes state
  permissions: { [key: string]: boolean } = {};

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    console.log('RoleEditComponent ngOnInit');
    
    // Get god status from JWT session (synchronous, no API call needed)
    this.currentUserIsGod = this.authService.isGod();
    console.log('Current user is god:', this.currentUserIsGod);

    this.route.params.subscribe(params => {
      console.log('Route params:', params);
      if (params['id']) {
        this.roleId = parseInt(params['id']);
        console.log('Setting roleId to:', this.roleId);
        this.loadRoleData();
      } else {
        console.log('No ID in params, redirecting');
        this.router.navigate(['/gofiliate/navigation/roles']);
      }
    });
  }

  loadRoleData(): void {
    if (!this.roleId) return;

    console.log('loadRoleData called with roleId:', this.roleId);
    const url = `/gofiliate/roles/${this.roleId}`;
    console.log('Making API call to:', url);
    
    this.loading = true;
    this.apiService.get(url, false).subscribe({
      next: (response) => {
        console.log('Role data response:', response);
        if (response.result) {
          this.role = response.role;
          this.sections = response.sections || [];
          this.endpoints = response.endpoints || [];
          this.availableActions = response.available_actions || [];
          this.enabledActions = response.enabled_actions || [];

          console.log('Sections:', this.sections);
          console.log('Endpoints:', this.endpoints);
          console.log('Enabled actions:', this.enabledActions);

          // Populate form
          this.roleForm = {
            role_id: this.role!.role_id,
            role_name: this.role!.role_name,
            role_description: this.role!.role_description,
            protected: this.role!.protected,
            status: this.role!.status
          };

          // Initialize permissions
          this.initializePermissions();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load role data:', err);
        this.toastr.error('Failed to load role data');
        this.loading = false;
        this.router.navigate(['/gofiliate/navigation/roles']);
      }
    });
  }

  initializePermissions(): void {
    this.permissions = {};
    
    // Set all enabled permissions to true
    this.enabledActions.forEach(action => {
      const key = this.getPermissionKey(action.endpoint_id, action.section_id, action.action_id);
      this.permissions[key] = true;
    });
  }

  getPermissionKey(endpointId: number, sectionId: number, actionId: number): string {
    return `r${this.roleId}_e${endpointId}_s${sectionId}_a${actionId}`;
  }

  getEndpointsForSection(sectionId: number): NavigationEndpoint[] {
    return this.endpoints.filter(endpoint => endpoint.section_id === sectionId);
  }

  setActiveTab(index: number): void {
    this.activeTab = index;
  }

  saveRole(): void {
    if (!this.roleId) return;

    if (!this.roleForm.role_name.trim()) {
      this.toastr.error('Role name is required');
      return;
    }

    if (this.role?.protected === 1 && !this.currentUserIsGod) {
      this.toastr.warning('Protected roles can only be edited by GOD users');
      return;
    }

    // Build enabled_actions array from checkboxes
    const enabledActions: RolePermission[] = [];
    
    Object.keys(this.permissions).forEach(key => {
      if (this.permissions[key]) {
        // Parse key format: r{roleId}_e{endpointId}_s{sectionId}_a{actionId}
        const match = key.match(/r(\d+)_e(\d+)_s(\d+)_a(\d+)/);
        if (match) {
          const [, roleId, endpointId, sectionId, actionId] = match;
          enabledActions.push({
            role_id: parseInt(roleId),
            endpoint_id: parseInt(endpointId),
            section_id: parseInt(sectionId),
            action_id: parseInt(actionId)
          });
        }
      }
    });

    const saveData = {
      role: this.roleForm,
      enabled_actions: enabledActions
    };

    this.loading = true;
    this.apiService.post(`/gofiliate/roles/permissions/${this.roleId}`, saveData, false).subscribe({
      next: (response) => {
        if (response.result) {
          this.toastr.success('Role updated successfully');
          this.router.navigate(['/gofiliate/navigation/roles']);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to save role:', err);
        this.toastr.error(err.error?.message || 'Failed to save role');
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/gofiliate/navigation/roles']);
  }
}
