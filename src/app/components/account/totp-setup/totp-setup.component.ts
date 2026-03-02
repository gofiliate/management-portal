import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QRCodeModule } from 'angularx-qrcode';
import { AuthService } from '../../../services/auth.service';
import { TOTPSetupResponse } from '../../../models/totp.model';

@Component({
  selector: 'app-totp-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, QRCodeModule],
  templateUrl: './totp-setup.component.html',
  styleUrls: ['./totp-setup.component.scss']
})
export class TotpSetupComponent implements OnInit {
  step: 'loading' | 'qr-code' | 'verify' | 'success' = 'loading';
  setupData: TOTPSetupResponse | null = null;
  verificationCode = '';
  isLoading = false;
  errorMessage = '';
  backupCodesDownloaded = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeSetup();
  }

  initializeSetup() {
    this.authService.setupTOTP().subscribe({
      next: (response) => {
        this.setupData = response;
        this.step = 'qr-code';
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to initialize 2FA setup';
        console.error('TOTP setup error:', error);
      }
    });
  }

  proceedToVerification() {
    if (!this.backupCodesDownloaded) {
      this.errorMessage = 'Please download your backup codes before proceeding';
      return;
    }
    this.step = 'verify';
    this.errorMessage = '';
  }

  onVerifyCode() {
    if (!this.verificationCode || this.verificationCode.length !== 6) {
      this.errorMessage = 'Please enter a 6-digit code';
      return;
    }

    if (!this.setupData) {
      this.errorMessage = 'Setup data not found';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verifyTOTPSetup(
      this.setupData.secret,
      this.verificationCode,
      this.setupData.backup_codes
    ).subscribe({
      next: (response) => {
        this.step = 'success';
        // Backend now returns a full JWT session after successful setup
        // Save it to replace the temporary session
        this.authService.saveSession(response);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Invalid code. Please try again.';
        this.verificationCode = '';
      }
    });
  }

  downloadBackupCodes() {
    if (!this.setupData) return;

    const content = [
      'Gofiliate Two-Factor Authentication Backup Codes',
      '================================================',
      '',
      'These codes can be used to access your account if you lose your authenticator device.',
      'Each code can only be used once.',
      '',
      'Save these codes in a secure location!',
      '',
      ...this.setupData.backup_codes.map((code, index) => `${index + 1}. ${code}`)
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gofiliate-backup-codes.txt';
    link.click();
    window.URL.revokeObjectURL(url);

    this.backupCodesDownloaded = true;
  }

  copySecret() {
    if (!this.setupData) return;
    
    navigator.clipboard.writeText(this.setupData.secret).then(() => {
      alert('Secret copied to clipboard');
    });
  }

  onCodeInput(event: any) {
    // Remove non-numeric characters
    this.verificationCode = event.target.value.replace(/\D/g, '');
  }

  complete() {
    this.router.navigate(['/dashboard']);
  }

  cancel() {
    // User hasn't completed 2FA setup, so clear session and return to login
    this.authService.logout();
    this.router.navigate(['/sign-in']);
  }
}
