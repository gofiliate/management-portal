import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../shared/page-header/page-header.component';

@Component({
  selector: 'app-client-onboarding',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './client-onboarding.component.html',
  styleUrl: './client-onboarding.component.scss'
})
export class ClientOnboardingComponent {

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Clients', link: '/clients' },
    { label: 'Onboarding' }
  ];

  onboardingOptions = [
    {
      title: 'Onboard New Client',
      description: 'Start the onboarding process for a new client',
      icon: 'fa fa-plus-circle',
      route: '/clients/onboarding/new',
      color: 'primary'
    },
    {
      title: 'In Progress Clients',
      description: 'View and manage clients currently in onboarding',
      icon: 'fa fa-users',
      route: '/clients/onboarding/in-progress',
      color: 'success'
    }
  ];

  constructor(private router: Router) {}

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
