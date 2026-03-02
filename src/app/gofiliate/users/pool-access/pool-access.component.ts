import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GofiliateService, User, Client, ClientInstance, Manager } from '../../../services/gofiliate.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-pool-access',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pool-access.component.html',
  styleUrls: ['./pool-access.component.scss']
})
export class PoolAccessComponent implements OnInit {
  userId: number = 0;
  user: User | null = null;
  loading = true;

  // Pool Access data
  clients: (Client & { selected: boolean })[] = [];
  instances: (ClientInstance & { selected: boolean; clientId: number })[] = [];
  managers: (Manager & { selected: boolean; instanceId: number })[] = [];
  
  // Track selected IDs
  selectedClientIds: Set<number> = new Set();
  selectedInstanceIds: Set<number> = new Set();
  selectedManagers: Set<string> = new Set(); // Format: "instanceId-managerId"

  // Filter for managers
  managerFilter: string = '';

  // Helper for templates
  Array = Array;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gofiliateService: GofiliateService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.userId = +params['user_id'];
      if (this.userId) {
        this.loadUser();
        this.loadClients();
      }
    });
  }

  loadUser(): void {
    this.gofiliateService.getUsers().subscribe({
      next: (response: any) => {
        if (!response.error && response.users) {
          this.user = response.users.find((u: User) => u.user_id === this.userId);
          if (!this.user) {
            this.toastr.error('User not found');
            this.router.navigate(['/gofiliate/users']);
          }
        }
      },
      error: () => {
        this.toastr.error('Failed to load user');
        this.router.navigate(['/gofiliate/users']);
      }
    });
  }

  loadClients(): void {
    this.gofiliateService.getClients().subscribe({
      next: (response: any) => {
        if (response && Array.isArray(response)) {
          this.clients = response.map((item: any) => ({
            ...item.client,
            selected: false
          }));
          // Load user access AFTER clients are loaded
          this.loadUserAccess();
        }
        this.loading = false;
      },
      error: () => {
        this.toastr.error('Failed to load clients');
        this.loading = false;
      }
    });
  }

  loadUserAccess(): void {
    this.gofiliateService.getPoolAccess(this.userId).subscribe({
      next: (response: any) => {
        if (!response || response.error) {
          return;
        }

        // Mark selected clients from pool access response
        if (response.client_access && Array.isArray(response.client_access)) {
          response.client_access.forEach((clientAccess: any) => {
            this.selectedClientIds.add(clientAccess.client_id);
            const client = this.clients.find(c => c.client_id === clientAccess.client_id);
            if (client) client.selected = true;
            // Load instances for this client
            this.loadInstancesForClient(clientAccess.client_id);
          });
        }

        // Mark selected instances from pool access response
        if (response.instance_access && Array.isArray(response.instance_access)) {
          response.instance_access.forEach((instanceAccess: any) => {
            this.selectedInstanceIds.add(instanceAccess.instance_id);
          });
        }

        // Mark selected managers from pool access response
        if (response.manager_access && Array.isArray(response.manager_access)) {
          response.manager_access.forEach((managerAccess: any) => {
            this.selectedManagers.add(`${managerAccess.instance_id}-${managerAccess.manager_id}`);
          });
        }
      },
      error: (error) => {
        // Silently fail - access tables might not have data yet
        console.log('User pool access data not available yet:', error);
      }
    });
  }

  toggleClientAccess(client: Client & { selected: boolean }): void {
    client.selected = !client.selected;
    
    if (client.selected) {
      this.selectedClientIds.add(client.client_id);
      this.loadInstancesForClient(client.client_id);
    } else {
      this.selectedClientIds.delete(client.client_id);
      
      // Get instances for this client BEFORE removing them
      const clientInstances = this.instances.filter(i => i.clientId === client.client_id);
      
      // Remove instance selections and manager selections for this client's instances
      clientInstances.forEach(inst => {
        this.selectedInstanceIds.delete(inst.instance_id);
        // Remove manager selections for this instance
        Array.from(this.selectedManagers).forEach(key => {
          if (key.startsWith(`${inst.instance_id}-`)) {
            this.selectedManagers.delete(key);
          }
        });
        // Remove managers for this instance
        this.managers = this.managers.filter(m => m.instanceId !== inst.instance_id);
      });
      
      // Now remove instances for this client
      this.instances = this.instances.filter(i => i.clientId !== client.client_id);
    }
  }

  loadInstancesForClient(clientId: number): void {
    this.gofiliateService.getClientInstances(clientId).subscribe({
      next: (response: any) => {
        if (response && Array.isArray(response)) {
          const newInstances = response.map((inst: any) => ({
            ...inst,
            clientId: clientId,
            selected: this.selectedInstanceIds.has(inst.instance_id)
          }));
          
          // Remove old instances for this client and add new ones
          this.instances = [
            ...this.instances.filter(i => i.clientId !== clientId),
            ...newInstances
          ];

          // Load managers for selected instances
          newInstances.forEach((inst: any) => {
            if (inst.selected && this.user?.has_managers) {
              this.loadManagersForInstance(inst.instance_id);
            }
          });
        }
      },
      error: () => {
        this.toastr.error('Failed to load instances');
      }
    });
  }

  toggleInstanceAccess(instance: ClientInstance & { selected: boolean; clientId: number }): void {
    instance.selected = !instance.selected;
    
    if (instance.selected) {
      this.selectedInstanceIds.add(instance.instance_id);
      // Load managers if has_managers permission is enabled
      if (this.user?.has_managers) {
        this.loadManagersForInstance(instance.instance_id);
      }
    } else {
      this.selectedInstanceIds.delete(instance.instance_id);
      // Remove managers for this instance
      this.managers = this.managers.filter(m => m.instanceId !== instance.instance_id);
      // Remove manager selections
      Array.from(this.selectedManagers).forEach(key => {
        if (key.startsWith(`${instance.instance_id}-`)) {
          this.selectedManagers.delete(key);
        }
      });
    }
  }

  loadManagersForInstance(instanceId: number): void {
    this.gofiliateService.getInstanceManagers(instanceId).subscribe({
      next: (response: any) => {
        if (response && Array.isArray(response)) {
          const newManagers = response.map((mgr: any) => ({
            ...mgr,
            instanceId: instanceId,
            selected: this.selectedManagers.has(`${instanceId}-${mgr.manager_id}`)
          }));
          
          // Remove old managers for this instance and add new ones
          this.managers = [
            ...this.managers.filter(m => m.instanceId !== instanceId),
            ...newManagers
          ];
        }
      },
      error: () => {
        this.toastr.error('Failed to load managers');
      }
    });
  }

  toggleManagerAccess(manager: Manager & { selected: boolean; instanceId: number }): void {
    manager.selected = !manager.selected;
    const key = `${manager.instanceId}-${manager.manager_id}`;
    
    if (manager.selected) {
      this.selectedManagers.add(key);
    } else {
      this.selectedManagers.delete(key);
    }
  }

  getInstancesForClient(clientId: number): (ClientInstance & { selected: boolean; clientId: number })[] {
    return this.instances.filter(i => i.clientId === clientId);
  }

  getManagersForInstance(instanceId: number): (Manager & { selected: boolean; instanceId: number })[] {
    const isInternal = this.user?.is_internal;
    const isGod = this.user?.is_god;
    const canSeeRoleOne = isInternal || isGod;
    const filterLower = this.managerFilter.toLowerCase().trim();
    
    return this.managers.filter(m => {
      if (m.instanceId !== instanceId) return false;
      // If user can't see role_id=1 managers, filter them out
      if (!canSeeRoleOne && m.account_role_id === 1) return false;
      // Apply text filter to username
      if (filterLower && !m.username.toLowerCase().includes(filterLower)) return false;
      return true;
    });
  }

  getClientName(clientId: number): string {
    return this.clients.find(c => c.client_id === clientId)?.client_name || '';
  }

  getInstanceName(instanceId: number): string {
    return this.instances.find(i => i.instance_id === instanceId)?.instance_name || '';
  }

  savePoolAccess(): void {
    const managerAccess = Array.from(this.selectedManagers).map(key => {
      const [instanceId, managerId] = key.split('-').map(Number);
      return { instance_id: instanceId, manager_id: managerId };
    });

    const accessData = {
      client_ids: Array.from(this.selectedClientIds),
      instance_ids: Array.from(this.selectedInstanceIds),
      manager_access: managerAccess,
      creator_id: this.userId // TODO: Get from authenticated user
    };

    this.gofiliateService.savePoolAccess(this.userId, accessData).subscribe({
      next: () => {
        this.toastr.success('Pool access updated successfully');
      },
      error: () => {
        this.toastr.error('Failed to update pool access');
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/gofiliate/users', this.userId]);
  }
}
