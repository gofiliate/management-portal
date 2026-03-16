import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PlatformAction {
  title: string;
  description: string;
  icon: string;
  section: string;
  color: string;
}

@Component({
  selector: 'app-platform-actions-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './platform-actions-grid.component.html',
  styleUrl: './platform-actions-grid.component.scss'
})
export class PlatformActionsGridComponent {
  @Input() hasLinkedToken: boolean = false;
  @Output() actionClick = new EventEmitter<string>();

  public platformActions: PlatformAction[] = [
    {
      title: 'Instance Details',
      description: 'Edit instance configuration and settings',
      icon: 'fa fa-cog',
      section: 'instance-details',
      color: 'primary'
    },
    {
      title: 'Account Managers',
      description: 'Manage user accounts and permissions',
      icon: 'fa fa-users',
      section: 'users',
      color: 'success'
    },
    {
      title: 'Affiliates',
      description: 'Manage affiliate partners and relationships',
      icon: 'fa fa-handshake',
      section: 'affiliates',
      color: 'warning'
    },
    {
      title: 'Brands',
      description: 'Manage brands and branding configuration',
      icon: 'fa fa-bookmark',
      section: 'brands',
      color: 'info'
    },
    {
      title: 'Landing Pages',
      description: 'Manage text links and geo groups',
      icon: 'fa fa-link',
      section: 'landing-pages',
      color: 'secondary'
    },
    {
      title: 'Emails',
      description: 'Manage email templates and configuration',
      icon: 'fa fa-envelope',
      section: 'emails',
      color: 'dark'
    },
    {
      title: 'Terms & Conditions',
      description: 'Manage terms and conditions documents',
      icon: 'fa fa-gavel',
      section: 'terms-conditions',
      color: 'primary'
    },
    {
      title: 'Commission Plans',
      description: 'Manage commission structures and plans',
      icon: 'fa fa-percent',
      section: 'commission-plans',
      color: 'success'
    }
  ];

  onActionClick(section: string): void {
    // Instance details is always accessible
    if (section === 'instance-details') {
      this.actionClick.emit(section);
      return;
    }
    
    // Other sections require linked token
    if (this.hasLinkedToken) {
      this.actionClick.emit(section);
    }
  }
}
