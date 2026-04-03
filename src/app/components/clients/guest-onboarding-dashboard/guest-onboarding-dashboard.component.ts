import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { GofiliateService } from '../../../services/gofiliate.service';
import { AuthService } from '../../../services/auth.service';
import { OnboardingRequest, OnboardingRequestSection, OnboardingRequestAssignment } from '../../../models/onboarding.model';

@Component({
  selector: 'app-guest-onboarding-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './guest-onboarding-dashboard.component.html',
  styleUrls: ['./guest-onboarding-dashboard.component.scss']
})
export class GuestOnboardingDashboardComponent implements OnInit {
  requestId!: number;
  request: OnboardingRequest | null = null;
  sections: OnboardingRequestSection[] = [];
  isLoading = true;
  currentUserId: number = 0;
  isPrimaryOwner = false;

  // Assignment modal
  showAssignModal = false;
  selectedSection: OnboardingRequestSection | null = null;
  assigneeEmail = '';
  isAssigning = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gofiliateService: GofiliateService,
    private authService: AuthService,
    private toast: ToastrService
  ) {}

  ngOnInit() {
    this.currentUserId = this.authService.getUserId();
    
    this.route.params.subscribe(params => {
      this.requestId = +params['requestId'];
      if (this.requestId) {
        this.loadRequest();
      }
    });
  }

  loadRequest() {
    this.isLoading = true;
    this.gofiliateService.getOnboardingRequest(this.requestId).subscribe({
      next: (response) => {
        if (response) {
          this.request = response;
          this.sections = response.sections || [];
          
          // Determine if user is primary owner:
          // 1. If guest_user_id is set and matches current user
          // 2. OR if guest_user_id is not set (invited guest, not yet linked to request)
          this.isPrimaryOwner = (this.request?.guest_user_id === this.currentUserId) || 
                                 (!this.request?.guest_user_id);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading request:', error);
        this.toast.error('Failed to load onboarding request');
        this.isLoading = false;
      }
    });
  }

  getSectionStatusBadge(section: OnboardingRequestSection): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'bg-secondary',
      'in_progress': 'bg-primary',
      'completed': 'bg-success'
    };
    return statusClasses[section.status] || 'bg-secondary';
  }

  getRequestStatusBadge(): string {
    if (!this.request) return 'bg-secondary';
    const statusClasses: { [key: string]: string } = {
      'draft': 'bg-secondary',
      'in_progress': 'bg-primary',
      'pending_review': 'bg-warning',
      'approved': 'bg-success',
      'rejected': 'bg-danger'
    };
    return statusClasses[this.request.status] || 'bg-secondary';
  }

  getSectionStatusText(section: OnboardingRequestSection): string {
    const statusTexts: { [key: string]: string } = {
      'pending': 'Not Started',
      'in_progress': 'In Progress',
      'completed': 'Completed'
    };
    return statusTexts[section.status] || 'Unknown';
  }

  canCompleteSection(section: OnboardingRequestSection): boolean {
    // Primary owner can complete any section
    // OR user is assigned to this specific section
    return this.isPrimaryOwner || (section.assignments?.some((a: OnboardingRequestAssignment) => a.user_id === this.currentUserId) || false);
  }

  canAssignSection(section: OnboardingRequestSection): boolean {
    // Only primary owner can assign sections
    // And only if section not already assigned
    return this.isPrimaryOwner && (!section.assignments || section.assignments.length === 0);
  }

  completeSection(section: OnboardingRequestSection) {
    this.router.navigate(['/onboarding/section', section.section_id]);
  }

  openAssignModal(section: OnboardingRequestSection) {
    this.selectedSection = section;
    this.assigneeEmail = '';
    this.showAssignModal = true;
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.selectedSection = null;
    this.assigneeEmail = '';
  }

  submitAssignment() {
    if (!this.selectedSection || !this.assigneeEmail.trim()) {
      this.toast.warning('Please enter an email address');
      return;
    }

    this.isAssigning = true;

    const assignmentData = {
      request_id: this.requestId,
      section_id: this.selectedSection.section_id,
      assignee_email: this.assigneeEmail
    };

    this.gofiliateService.assignUserToSection(assignmentData).subscribe({
      next: (response) => {
        this.toast.success('Section assigned successfully');
        this.closeAssignModal();
        this.loadRequest(); // Reload to see updates
        this.isAssigning = false;
      },
      error: (error) => {
        console.error('Error assigning section:', error);
        this.toast.error('Failed to assign section');
        this.isAssigning = false;
      }
    });
  }

  getCompletionPercentage(): number {
    if (!this.sections || this.sections.length === 0) return 0;
    const completed = this.sections.filter(s => s.status === 'completed').length;
    return Math.round((completed / this.sections.length) * 100);
  }

  getStatusText(): string {
    const statusTexts: { [key: string]: string } = {
      'draft': 'Draft',
      'in_progress': 'In Progress',
      'pending_review': 'Pending Review',
      'approved': 'Approved',
      'rejected': 'Rejected'
    };
    return this.request ? (statusTexts[this.request.status] || 'Unknown') : '';
  }
}
