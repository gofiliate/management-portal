import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { GofiliateService } from '../../../services/gofiliate.service';

@Component({
  selector: 'app-guest-onboarding-invitation',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './guest-onboarding-invitation.component.html',
  styleUrls: ['./guest-onboarding-invitation.component.scss']
})
export class GuestOnboardingInvitationComponent implements OnInit {
  token: string = '';
  isLoading = true;
  isValidToken = false;
  invitation: any = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastrService,
    private gofiliateService: GofiliateService
  ) {}

  ngOnInit() {
    // Get token from route params
    this.route.params.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        this.validateToken();
      } else {
        this.isLoading = false;
        this.toast.error('Invalid invitation link');
      }
    });
  }

  validateToken() {
    this.gofiliateService.validateInvitation(this.token).subscribe({
      next: (response) => {
        if (response.result) {
          this.isValidToken = true;
          this.invitation = response;

          // Store invitation context for post-login redirect
          if (response.invitation_type === 'onboarding_request' && response.onboarding_request) {
            sessionStorage.setItem('pending_onboarding_redirect', JSON.stringify({
              type: 'request',
              requestId: response.onboarding_request.request_id
            }));
          } else if (response.invitation_type === 'onboarding_section' && response.assignment) {
            sessionStorage.setItem('pending_onboarding_redirect', JSON.stringify({
              type: 'section',
              requestId: response.assignment.request_id,
              sectionId: response.assignment.section_id
            }));
          }
        } else {
          this.isValidToken = false;
          this.toast.error(response.message || 'Invalid or expired invitation');
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isValidToken = false;
        this.isLoading = false;
        this.toast.error('Failed to validate invitation');
        console.error('Token validation error:', error);
      }
    });
  }

  goToSignIn() {
    this.router.navigate(['/sign-in']);
  }
}
