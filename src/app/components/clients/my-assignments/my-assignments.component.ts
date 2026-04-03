import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../shared/page-header/page-header.component';
import { GofiliateService } from '../../../services/gofiliate.service';

interface EnrichedAssignment {
  assignment: {
    assignment_id: number;
    request_id: number;
    section_id: number;
    user_id: number;
    assigned_by: number;
    assignment_note?: string;
    notification_sent: boolean;
    notification_sent_at?: string;
    invitation_token?: string;
    invitation_sent_at?: string;
    last_viewed_at?: string;
    created_at: string;
  };
  request: {
    request_id: number;
    request_reference: string;
    company_name_preliminary: string;
    contact_email?: string;
    contact_name?: string;
    status: string;
    completion_percentage: number;
    created_at: string;
  };
  section: {
    section_id: number;
    request_id: number;
    section_type: string;
    section_title: string;
    section_description?: string;
    status: string;
    is_required: boolean;
    completed_by?: number;
    completed_at?: string;
    display_order: number;
  };
}

interface RequestGroup {
  request: any;
  assignments: EnrichedAssignment[];
}

@Component({
  selector: 'app-my-assignments',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './my-assignments.component.html',
  styleUrl: './my-assignments.component.scss'
})
export class MyAssignmentsComponent implements OnInit {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Onboarding', link: '/clients/onboarding' },
    { label: 'My Assignments', link: '/onboarding/my-assignments' }
  ];

  assignments: EnrichedAssignment[] = [];
  groupedAssignments: RequestGroup[] = [];
  isLoading = false;

  constructor(
    private gofiliateService: GofiliateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAssignments();
  }

  loadAssignments(): void {
    this.isLoading = true;
    this.gofiliateService.getUserAssignments().subscribe({
      next: (response: EnrichedAssignment[]) => {
        this.assignments = response || [];
        this.groupAssignmentsByRequest();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading assignments:', error);
        this.isLoading = false;
      }
    });
  }

  groupAssignmentsByRequest(): void {
    const grouped = new Map<number, RequestGroup>();

    for (const assignment of this.assignments) {
      const requestId = assignment.request.request_id;
      
      if (!grouped.has(requestId)) {
        grouped.set(requestId, {
          request: assignment.request,
          assignments: []
        });
      }
      
      grouped.get(requestId)!.assignments.push(assignment);
    }

    // Convert to array and sort by most recent assignment
    this.groupedAssignments = Array.from(grouped.values()).sort((a, b) => {
      const dateA = new Date(a.assignments[0]?.assignment.created_at || 0);
      const dateB = new Date(b.assignments[0]?.assignment.created_at || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }

  getSectionStatusBadge(status: string): string {
    const badges: { [key: string]: string } = {
      'pending': 'bg-secondary',
      'in_progress': 'bg-primary',
      'completed': 'bg-success'
    };
    return badges[status] || 'bg-secondary';
  }

  getSectionStatusText(status: string): string {
    const statusText: { [key: string]: string } = {
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'completed': 'Completed'
    };
    return statusText[status] || status;
  }

  getRequestStatusBadge(status: string): string {
    const badges: { [key: string]: string } = {
      'draft': 'bg-secondary',
      'in_progress': 'bg-primary',
      'pending_review': 'bg-warning',
      'approved': 'bg-success',
      'rejected': 'bg-danger'
    };
    return badges[status] || 'bg-secondary';
  }

  getRequestStatusText(status: string): string {
    const statusText: { [key: string]: string } = {
      'draft': 'Draft',
      'in_progress': 'In Progress',
      'pending_review': 'Pending Review',
      'approved': 'Approved',
      'rejected': 'Rejected'
    };
    return statusText[status] || status;
  }

  completeSection(requestId: number, sectionId: number): void {
    this.router.navigate(['/clients/onboarding/requests', requestId, 'sections', sectionId]);
  }

  viewRequest(requestId: number): void {
    this.router.navigate(['/clients/onboarding/requests', requestId]);
  }
}
