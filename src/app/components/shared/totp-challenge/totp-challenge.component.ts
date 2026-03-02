import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-totp-challenge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './totp-challenge.component.html',
  styleUrls: ['./totp-challenge.component.scss']
})
export class TotpChallengeComponent {
  @Input() username: string = '';
  @Input() isVisible: boolean = false;
  @Output() onSuccess = new EventEmitter<string>();
  @Output() onCancel = new EventEmitter<void>();
  
  public totpCode: string = '';
  public isVerifying: boolean = false;
  public errorMessage: string = '';

  onCodeInput(event: any): void {
    // Only allow digits
    this.totpCode = event.target.value.replace(/\D/g, '').substring(0, 6);
    this.errorMessage = '';
  }

  submitCode(): void {
    if (this.totpCode.length !== 6) {
      this.errorMessage = 'Please enter a 6-digit code';
      return;
    }

    this.isVerifying = true;
    this.errorMessage = '';
    
    // Emit the code to parent component for verification
    this.onSuccess.emit(this.totpCode);
  }

  cancel(): void {
    this.reset();
    this.onCancel.emit();
  }

  reset(): void {
    this.totpCode = '';
    this.isVerifying = false;
    this.errorMessage = '';
  }

  setError(message: string): void {
    this.errorMessage = message;
    this.isVerifying = false;
  }
}
