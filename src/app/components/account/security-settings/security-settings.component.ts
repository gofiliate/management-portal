import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-security-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './security-settings.component.html',
  styleUrls: ['./security-settings.component.scss']
})
export class SecuritySettingsComponent implements OnInit {
  totpEnabled = false;
  showDisableModal = false;
  disablePassword = '';
  isProcessing = false;
  errorMessage = '';
  successMessage = '';
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.totpEnabled = this.authService.hasTOTPEnabled();
  }

  enableTOTP() {
    this.router.navigate(['/account/totp-setup']);
  }

  openDisableModal() {
    this.showDisableModal = true;
    this.disablePassword = '';
    this.errorMessage = '';
  }

  closeDisableModal() {
    this.showDisableModal = false;
    this.disablePassword = '';
    this.errorMessage = '';
  }

  confirmDisable() {
    if (!this.disablePassword) {
      this.errorMessage = 'Please enter your password';
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';

    this.authService.disableTOTP(this.disablePassword).subscribe({
      next: () => {
        this.totpEnabled = false;
        this.showDisableModal = false;
        this.successMessage = 'Two-factor authentication has been disabled';
        
        // Update local session
        const session = this.authService.getSession();
        if (session) {
          session.totp_enabled = false;
          this.authService.saveSession(session);
        }

        this.isProcessing = false;
      },
      error: (error) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.message || 'Failed to disable 2FA. Check your password.';
      }
    });
  }
}
