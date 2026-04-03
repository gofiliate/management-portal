import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-totp-verify',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './totp-verify.component.html',
  styleUrls: ['./totp-verify.component.scss']
})
export class TotpVerifyComponent implements OnInit {
  code = '';
  username = '';
  isLoading = false;
  errorMessage = '';
  showBackupCodeEntry = false;
  backupCode = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Get username from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.username = navigation.extras.state['username'] || '';
    }
  }

  ngOnInit() {
    // If no username, redirect back to sign-in
    if (!this.username) {
      this.router.navigate(['/sign-in']);
    }
  }

  onVerifyCode() {
    if (!this.code || this.code.length !== 6) {
      this.errorMessage = 'Please enter a 6-digit code';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verifyTOTPLogin(this.username, this.code).subscribe({
      next: (session) => {
        this.authService.saveSession(session);
        
        // Check for pending onboarding redirect
        const pendingRedirect = sessionStorage.getItem('pending_onboarding_redirect');
        if (pendingRedirect) {
          try {
            const redirect = JSON.parse(pendingRedirect);
            sessionStorage.removeItem('pending_onboarding_redirect');
            
            if (redirect.type === 'request') {
              this.router.navigate(['/onboarding/request', redirect.requestId]);
            } else if (redirect.type === 'section') {
              this.router.navigate(['/onboarding/section', redirect.sectionId]);
            } else {
              this.router.navigate(['/dashboard']);
            }
          } catch (e) {
            console.error('Error parsing pending redirect:', e);
            this.router.navigate(['/dashboard']);
          }
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Invalid code. Please try again.';
        this.code = '';
      }
    });
  }

  onUseBackupCode() {
    if (!this.backupCode || this.backupCode.length < 8) {
      this.errorMessage = 'Please enter a valid backup code';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.useBackupCode(this.username, this.backupCode).subscribe({
      next: (session) => {
        this.authService.saveSession(session);
        
        // Check for pending onboarding redirect
        const pendingRedirect = sessionStorage.getItem('pending_onboarding_redirect');
        if (pendingRedirect) {
          try {
            const redirect = JSON.parse(pendingRedirect);
            sessionStorage.removeItem('pending_onboarding_redirect');
            
            if (redirect.type === 'request') {
              this.router.navigate(['/onboarding/request', redirect.requestId]);
            } else if (redirect.type === 'section') {
              this.router.navigate(['/onboarding/section', redirect.sectionId]);
            } else {
              this.router.navigate(['/dashboard']);
            }
          } catch (e) {
            console.error('Error parsing pending redirect:', e);
            this.router.navigate(['/dashboard']);
          }
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Invalid backup code.';
        this.backupCode = '';
      }
    });
  }

  toggleBackupCodeEntry() {
    this.showBackupCodeEntry = !this.showBackupCodeEntry;
    this.errorMessage = '';
    this.code = '';
    this.backupCode = '';
  }

  onCodeInput(event: any) {
    // Remove non-numeric characters
    this.code = event.target.value.replace(/\D/g, '');
    
    // Auto-submit when 6 digits are entered
    if (this.code.length === 6) {
      this.onVerifyCode();
    }
  }

  goBack() {
    this.router.navigate(['/sign-in']);
  }
}
