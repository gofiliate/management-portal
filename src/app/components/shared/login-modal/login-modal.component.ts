import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.scss'
})
export class LoginModalComponent implements OnChanges {
  @Input() show: boolean = false;
  @Input() headerText: string = 'Login';
  @Input() buttonText: string = 'Login';
  @Input() buttonIcon?: string;
  @Input() showModeSelector: boolean = false;
  @Input() prefilledUsername?: string; // New input for pre-filling username
  @Input() disableUsername: boolean = false; // New input to disable username field
  
  @Output() connect = new EventEmitter<{username: string, password: string, mode?: string}>();
  @Output() cancel = new EventEmitter<void>();

  public credentials = {
    username: '',
    password: ''
  };
  public mode: 'admin' | 'affiliate' = 'admin';

  ngOnChanges(changes: SimpleChanges): void {
    // Pre-fill username when modal opens or when prefilledUsername changes
    if (changes['prefilledUsername'] && this.prefilledUsername) {
      this.credentials.username = this.prefilledUsername;
    }
    
    // Reset password when modal is shown
    if (changes['show'] && this.show) {
      this.credentials.password = '';
      if (this.prefilledUsername) {
        this.credentials.username = this.prefilledUsername;
      }
    }
  }

  public onConnect(): void {
    if (this.credentials.username && this.credentials.password) {
      this.connect.emit({
        username: this.credentials.username,
        password: this.credentials.password,
        mode: this.showModeSelector ? this.mode : undefined
      });
      this.resetForm();
    }
  }

  public onCancel(): void {
    this.resetForm();
    this.cancel.emit();
  }

  private resetForm(): void {
    this.credentials = {
      username: this.prefilledUsername || '',
      password: ''
    };
  }
}
