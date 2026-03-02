import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrl: './confirmation-modal.component.scss'
})
export class ConfirmationModalComponent {
  @Input() show: boolean = false;
  @Input() headerText: string = 'Confirm Action';
  @Input() buttonText: string = 'Confirm';
  @Input() buttonIcon?: string;
  @Input() showWarningIcon: boolean = true;
  @Input() showBody: boolean = true;
  
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  public onConfirm(): void {
    this.confirm.emit();
  }

  public onCancel(): void {
    this.cancel.emit();
  }
}
