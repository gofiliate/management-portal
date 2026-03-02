import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Affiliate {
  user_id: number;
  username: string;
  join_date: string;
  country: string;
  status: string;
  admin_id?: number;
  admin_username?: string;
  email?: string;
  company?: string;
}

@Component({
  selector: 'app-affiliates-summary',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './affiliates-summary.component.html',
  styleUrl: './affiliates-summary.component.scss'
})
export class AffiliatesSummaryComponent {
  
  @Input() affiliates: Affiliate[] = [];
  @Input() syncing: boolean = false;
  @Input() lastSyncWasForced: boolean = false;
  @Input() instanceId: number = 0;
  @Input() hasLinkedToken: boolean = false;

  @Output() sync = new EventEmitter<void>();
  @Output() forceSync = new EventEmitter<void>();

  get totalAffiliates(): number {
    return this.affiliates.length;
  }

  get allowedAffiliates(): number {
    return this.affiliates.filter(a => a.status === 'ALLOWED').length;
  }

  get deniedAffiliates(): number {
    return this.affiliates.filter(a => a.status === 'DENIED').length;
  }

  get pendingAffiliates(): number {
    return this.affiliates.filter(a => a.status === 'PENDING').length;
  }

  get newAffiliates(): number {
    return this.affiliates.filter(a => a.status === 'NEW').length;
  }

  get statusBreakdown(): { [key: string]: number } {
    const breakdown: { [key: string]: number } = {};
    this.affiliates.forEach(affiliate => {
      const status = affiliate.status;
      breakdown[status] = (breakdown[status] || 0) + 1;
    });
    return breakdown;
  }

  get statusBreakdownEntries(): Array<{ status: string; count: number }> {
    const statusOrder = ['NEW', 'PENDING', 'ALLOWED', 'DENIED'];
    
    return Object.entries(this.statusBreakdown)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => {
        const indexA = statusOrder.indexOf(a.status);
        const indexB = statusOrder.indexOf(b.status);
        
        // If both statuses are in the order list, sort by position
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        
        // If only one is in the list, prioritize it
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        // If neither is in the list, sort alphabetically
        return a.status.localeCompare(b.status);
      });
  }

  get dataSourceLabel(): string {
    if (this.lastSyncWasForced) {
      return 'Manual Sync';
    }
    return this.affiliates.length > 0 ? 'Cached' : 'None';
  }

  onSync(): void {
    this.sync.emit();
  }

  onForceSync(): void {
    this.forceSync.emit();
  }
}
