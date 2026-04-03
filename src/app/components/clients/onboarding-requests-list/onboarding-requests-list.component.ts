import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../shared/page-header/page-header.component';
import { GofiliateService } from '../../../services/gofiliate.service';
import { OnboardingRequest } from '../../../models/onboarding.model';

@Component({
  selector: 'app-onboarding-requests-list',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './onboarding-requests-list.component.html',
  styleUrl: './onboarding-requests-list.component.scss'
})
export class OnboardingRequestsListComponent implements OnInit {
  breadcrumbs: BreadcrumbItem[] = [];

  requests: OnboardingRequest[] = [];
  filteredRequests: OnboardingRequest[] = [];
  isLoading = false;
  selectedStatus: string = 'all';

  statusOptions = [
    { value: 'all', label: 'All Requests', count: 0 },
    { value: 'draft', label: 'Draft', count: 0 },
    { value: 'in_progress', label: 'In Progress', count: 0 },
    { value: 'pending_review', label: 'Pending Review', count: 0 },
    { value: 'approved', label: 'Approved', count: 0 },
    { value: 'rejected', label: 'Rejected', count: 0 }
  ];

  constructor(
    private gofiliateService: GofiliateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading = true;
    this.gofiliateService.getOnboardingRequests().subscribe({
      next: (response) => {
        if (response && Array.isArray(response)) {
          this.requests = response;
        } else {
          this.requests = [];
        }
        this.updateStatusCounts();
        this.filterRequests();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading onboarding requests:', error);
        this.isLoading = false;
      }
    });
  }

  updateStatusCounts(): void {
    this.statusOptions[0].count = this.requests.length;
    this.statusOptions[1].count = this.requests.filter(r => r.status === 'draft').length;
    this.statusOptions[2].count = this.requests.filter(r => r.status === 'in_progress').length;
    this.statusOptions[3].count = this.requests.filter(r => r.status === 'pending_review').length;
    this.statusOptions[4].count = this.requests.filter(r => r.status === 'approved').length;
    this.statusOptions[5].count = this.requests.filter(r => r.status === 'rejected').length;
  }

  filterRequests(): void {
    if (this.selectedStatus === 'all') {
      this.filteredRequests = [...this.requests];
    } else {
      this.filteredRequests = this.requests.filter(r => r.status === this.selectedStatus);
    }
  }

  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.filterRequests();
  }

  viewRequest(requestId: number): void {
    this.router.navigate(['/clients/onboarding/requests', requestId]);
  }

  createNewRequest(): void {
    this.router.navigate(['/clients/onboarding/new']);
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'draft': 'badge-secondary',
      'in_progress': 'badge-info',
      'pending_review': 'badge-warning',
      'approved': 'badge-success',
      'rejected': 'badge-danger'
    };
    return statusMap[status] || 'badge-secondary';
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'draft': 'Draft',
      'in_progress': 'In Progress',
      'pending_review': 'Pending Review',
      'approved': 'Approved',
      'rejected': 'Rejected'
    };
    return statusMap[status] || status;
  }

  getProgressBarClass(percentage: number): string {
    if (percentage < 25) return 'bg-danger';
    if (percentage < 50) return 'bg-warning';
    if (percentage < 75) return 'bg-info';
    return 'bg-success';
  }
}
