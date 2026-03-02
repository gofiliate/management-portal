import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { GofiliateService } from '../../../services/gofiliate.service';

@Component({
  selector: 'app-invitation-accept',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './invitation-accept.component.html',
  styleUrls: ['./invitation-accept.component.scss']
})
export class InvitationAcceptComponent implements OnInit {
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
          this.invitation = response.invitation;
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
