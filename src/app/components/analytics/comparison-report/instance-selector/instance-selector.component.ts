import { Component, EventEmitter, Input, Output, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Instance {
  id: number;
  name: string;
  selected?: boolean;
}

@Component({
  selector: 'app-instance-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instance-selector.component.html',
  styleUrl: './instance-selector.component.scss'
})
export class InstanceSelectorComponent implements OnInit {
  @Input() availableInstances: Instance[] = [];
  @Output() instancesChange = new EventEmitter<number[]>();

  selectedInstances: number[] = [];
  showDropdown: boolean = false;
  validationError: string = '';
  selectAll: boolean = false;

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close dropdown if click is outside the component
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  ngOnInit() {
    // Pre-select all instances by default
    if (this.availableInstances.length > 0) {
      this.selectAll = true;
      this.toggleSelectAll();
    }
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  toggleInstance(instanceId: number) {
    const index = this.selectedInstances.indexOf(instanceId);
    if (index > -1) {
      this.selectedInstances.splice(index, 1);
    } else {
      this.selectedInstances.push(instanceId);
    }
    
    this.selectAll = this.selectedInstances.length === this.availableInstances.length;
    this.validateAndEmit();
  }

  toggleSelectAll() {
    if (this.selectAll) {
      this.selectedInstances = this.availableInstances.map(i => i.id);
    } else {
      this.selectedInstances = [];
    }
    this.validateAndEmit();
  }

  isSelected(instanceId: number): boolean {
    return this.selectedInstances.includes(instanceId);
  }

  getSelectedCount(): number {
    return this.selectedInstances.length;
  }

  getSelectionLabel(): string {
    const count = this.getSelectedCount();
    if (count === 0) {
      return 'Select instances...';
    } else if (count === this.availableInstances.length) {
      return `All instances (${count})`;
    } else {
      return `${count} instance${count !== 1 ? 's' : ''} selected`;
    }
  }

  getInstanceName(instanceId: number): string {
    const instance = this.availableInstances.find(i => i.id === instanceId);
    return instance ? instance.name : `Instance ${instanceId}`;
  }

  private validateAndEmit() {
    this.validationError = '';

    if (this.selectedInstances.length === 0) {
      this.validationError = 'At least one instance must be selected';
      this.instancesChange.emit([]);
      return;
    }

    if (this.selectedInstances.length === 1) {
      this.validationError = 'Select at least 2 instances for comparison';
      this.instancesChange.emit(this.selectedInstances);
      return;
    }

    if (this.selectedInstances.length > 10) {
      this.validationError = 'Warning: Selecting more than 10 instances may impact performance';
      // Allow but warn
    }

    this.instancesChange.emit([...this.selectedInstances]);
  }
}
