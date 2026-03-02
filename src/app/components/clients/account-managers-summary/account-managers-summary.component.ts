import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Manager {
  user_id: number;
  username: string;
  user_role: string;
  role_id: number;
  email: string;
  description: string;
  full_name: string;
  status: string;
  access_type_id: number;
  player_access: boolean;
  support_access?: boolean;
}

@Component({
  selector: 'app-account-managers-summary',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './account-managers-summary.component.html',
  styleUrl: './account-managers-summary.component.scss'
})
export class AccountManagersSummaryComponent {
  
  @Input() managers: Manager[] = [];
  @Input() syncing: boolean = false;
  @Input() lastSyncWasForced: boolean = false;
  @Input() instanceId: number = 0;
  @Input() hasLinkedToken: boolean = false;

  @Output() sync = new EventEmitter<void>();
  @Output() forceSync = new EventEmitter<void>();

  get totalManagers(): number {
    return this.managers.length;
  }

  get allowedManagers(): number {
    return this.managers.filter(m => m.status === 'ALLOWED').length;
  }

  get deniedManagers(): number {
    return this.managers.filter(m => m.status === 'DENIED').length;
  }

  get roleBreakdown(): { [key: string]: number } {
    const breakdown: { [key: string]: number } = {};
    this.managers.forEach(manager => {
      const roleName = manager.user_role;
      breakdown[roleName] = (breakdown[roleName] || 0) + 1;
    });
    return breakdown;
  }

  get roleBreakdownEntries(): Array<{ role: string; count: number }> {
    const roleOrder = ['Gofiliate', 'Admin', 'Affiliate Manager'];
    
    return Object.entries(this.roleBreakdown)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => {
        const indexA = roleOrder.indexOf(a.role);
        const indexB = roleOrder.indexOf(b.role);
        
        // If both roles are in the order list, sort by position
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        
        // If only one is in the list, prioritize it
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        // If neither is in the list, sort alphabetically
        return a.role.localeCompare(b.role);
      });
  }

  get dataSourceLabel(): string {
    if (this.lastSyncWasForced) {
      return 'Manual Sync';
    }
    return this.managers.length > 0 ? 'Cached' : 'None';
  }

  onSync(): void {
    this.sync.emit();
  }

  onForceSync(): void {
    this.forceSync.emit();
  }
}
