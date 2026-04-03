import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../shared/page-header/page-header.component';
import { GofiliateService } from '../../../services/gofiliate.service';
import { OnboardingRequest, OnboardingRequestSection, OnboardingRequestAssignment, OnboardingRequestActivity } from '../../../models/onboarding.model';

@Component({
  selector: 'app-onboarding-request-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
  templateUrl: './onboarding-request-detail.component.html',
  styleUrl: './onboarding-request-detail.component.scss'
})
export class OnboardingRequestDetailComponent implements OnInit {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Clients', link: '/clients' },
    { label: 'Onboarding', link: '/clients/onboarding' },
    { label: 'Requests', link: '/clients/onboarding/requests' },
    { label: 'Loading...' }
  ];

  request: OnboardingRequest | null = null;
  activities: OnboardingRequestActivity[] = [];
  isLoading = false;
  activeTab: string = 'overview';

  // Modal states
  showApproveModal = false;
  showRejectModal = false;
  showLinkClientModal = false;
  showAssignUserModal = false;
  
  // Form models
  approvalNotes = '';
  rejectionReason = '';
  clientIdToLink: number | null = null;
  selectedSectionForAssignment: number | null = null;
  assigneeEmail = '';
  assignmentNote = '';
  
  // Client search for linking
  clients: any[] = [];
  filteredClients: any[] = [];
  clientSearchTerm = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gofiliateService: GofiliateService
  ) {}

  ngOnInit(): void {
    const requestId = this.route.snapshot.paramMap.get('id');
    if (requestId) {
      this.loadRequest(parseInt(requestId));
      this.loadActivities(parseInt(requestId));
    }
    this.loadClients();
  }

  loadClients(): void {
    this.gofiliateService.getClients().subscribe({
      next: (response) => {
        if (response) {
          this.clients = response;
          this.filteredClients = [...this.clients];
        }
      },
      error: (error) => {
        console.error('Error loading clients:', error);
      }
    });
  }

  filterClients(): void {
    if (!this.clientSearchTerm.trim()) {
      this.filteredClients = [...this.clients];
    } else {
      const term = this.clientSearchTerm.toLowerCase();
      this.filteredClients = this.clients.filter(c => 
        c.name?.toLowerCase().includes(term) ||
        c.company_name?.toLowerCase().includes(term) ||
        c.client_id?.toString().includes(term)
      );
    }
  }

  selectClient(clientId: number): void {
    this.clientIdToLink = clientId;
  }

  loadRequest(requestId: number): void {
    this.isLoading = true;
    this.gofiliateService.getOnboardingRequest(requestId).subscribe({
      next: (response) => {
        this.request = response;
        this.breadcrumbs[3].label = this.request?.company_name_preliminary || `Request #${requestId}`;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading onboarding request:', error);
        this.isLoading = false;
      }
    });
  }

  loadActivities(requestId: number): void {
    this.gofiliateService.getRequestActivity(requestId).subscribe({
      next: (response) => {
        if (response && Array.isArray(response)) {
          this.activities = response;
        }
      },
      error: (error) => {
        console.error('Error loading activities:', error);
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Status Badge Helper
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

  // Section Status Helper
  getSectionStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'badge-secondary',
      'assigned': 'badge-info',
      'in_progress': 'badge-primary',
      'completed': 'badge-success'
    };
    return statusMap[status] || 'badge-secondary';
  }

  // Progress Bar Helper
  getProgressBarClass(percentage: number): string {
    if (percentage < 25) return 'bg-danger';
    if (percentage < 50) return 'bg-warning';
    if (percentage < 75) return 'bg-info';
    return 'bg-success';
  }

  // Get incomplete sections
  getIncompleteSections(): OnboardingRequestSection[] {
    if (!this.request?.sections) return [];
    return this.request.sections.filter(s => s.status !== 'completed');
  }

  // Get assignments for a specific section
  getAssignmentsForSection(sectionId: number): OnboardingRequestAssignment[] {
    if (!this.request?.assignments) return [];
    return this.request.assignments.filter(a => a.section_id === sectionId);
  }

  // Get section by ID
  getSectionById(sectionId: number): OnboardingRequestSection | undefined {
    if (!this.request?.sections) return undefined;
    return this.request.sections.find(s => s.section_id === sectionId);
  }

  // Check if request can be approved
  canApprove(): boolean {
    return this.request?.status === 'pending_review' && 
           this.request?.completion_percentage === 100;
  }

  canReject(): boolean {
    return this.request?.status === 'pending_review';
  }

  canLinkClient(): boolean {
    return this.request?.status === 'approved' && !this.request?.client_id;
  }

  // Approve Request
  openApproveModal(): void {
    this.showApproveModal = true;
    this.approvalNotes = '';
  }

  confirmApprove(): void {
    if (!this.request) return;
    
    this.gofiliateService.approveOnboardingRequest(this.request.request_id, {
      admin_notes: this.approvalNotes
    }).subscribe({
      next: () => {
        this.showApproveModal = false;
        this.loadRequest(this.request!.request_id);
        this.loadActivities(this.request!.request_id);
      },
      error: (error) => {
        console.error('Error approving request:', error);
      }
    });
  }

  // Reject Request
  openRejectModal(): void {
    this.showRejectModal = true;
    this.rejectionReason = '';
  }

  confirmReject(): void {
    if (!this.request || !this.rejectionReason.trim()) return;
    
    this.gofiliateService.rejectOnboardingRequest(this.request.request_id, {
      rejection_reason: this.rejectionReason
    }).subscribe({
      next: () => {
        this.showRejectModal = false;
        this.loadRequest(this.request!.request_id);
        this.loadActivities(this.request!.request_id);
      },
      error: (error) => {
        console.error('Error rejecting request:', error);
      }
    });
  }

  // Link Client
  openLinkClientModal(): void {
    this.showLinkClientModal = true;
    this.clientIdToLink = null;
    this.clientSearchTerm = '';
    this.filteredClients = [...this.clients];
  }

  confirmLinkClient(): void {
    if (!this.request || !this.clientIdToLink) return;
    
    this.gofiliateService.linkClientToRequest(this.request.request_id, this.clientIdToLink).subscribe({
      next: () => {
        this.showLinkClientModal = false;
        this.loadRequest(this.request!.request_id);
        this.loadActivities(this.request!.request_id);
      },
      error: (error) => {
        console.error('Error linking client:', error);
      }
    });
  }

  // Assign User
  openAssignUserModal(sectionId: number): void {
    this.selectedSectionForAssignment = sectionId;
    this.assigneeEmail = '';
    this.assignmentNote = '';
    this.showAssignUserModal = true;
  }

  confirmAssignUser(): void {
    if (!this.request || !this.selectedSectionForAssignment || !this.assigneeEmail.trim()) return;
    
    this.gofiliateService.assignUserToSection({
      request_id: this.request.request_id,
      section_id: this.selectedSectionForAssignment,
      assignee_email: this.assigneeEmail.trim(),
      note: this.assignmentNote.trim() || undefined
    }).subscribe({
      next: () => {
        this.showAssignUserModal = false;
        this.loadRequest(this.request!.request_id);
        this.loadActivities(this.request!.request_id);
      },
      error: (error) => {
        console.error('Error assigning user:', error);
      }
    });
  }

  // View Section Detail
  viewSection(sectionId: number): void {
    this.router.navigate(['/clients/onboarding/requests', this.request!.request_id, 'sections', sectionId]);
  }

  // Navigate back
  goBack(): void {
    this.router.navigate(['/clients/onboarding/requests']);
  }

  // Close modals
  closeModals(): void {
    this.showApproveModal = false;
    this.showRejectModal = false;
    this.showLinkClientModal = false;
    this.showAssignUserModal = false;
  }
}
