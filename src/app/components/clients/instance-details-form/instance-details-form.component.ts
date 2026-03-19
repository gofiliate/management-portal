import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface InstanceDetails {
  instance_id: number;
  instance_name: string;
  hostname: string;
  ip_address: string;
  api_endpoint: string;
  ad_endpoint?: string;
  aff_endpoint: string;
  admin_endpoint: string;
  api_key: string;
  jwt_key?: string;
  heartbeat_port?: number;
  is_single_brand: number;
  is_live: number;
  created: string;
  updated: string;
  status: number;
  client_logo?: string;
  is_public: number;
}

@Component({
  selector: 'app-instance-details-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instance-details-form.component.html',
  styleUrl: './instance-details-form.component.scss'
})
export class InstanceDetailsFormComponent {
  @Input() instance!: InstanceDetails;
  @Input() isGod: boolean = false;
  @Input() apiKeyDisplay: string = '';
  @Input() jwtKeyDisplay: string = '';
  @Input() editAPIKey: boolean = false;
  @Input() editJWTKey: boolean = false;
  
  @Output() save = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() toggleAPIKey = new EventEmitter<void>();
  @Output() toggleJWTKey = new EventEmitter<void>();

  onSave(): void {
    this.save.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }

  toggleEditAPIKey(): void {
    this.toggleAPIKey.emit();
  }

  toggleEditJWTKey(): void {
    this.toggleJWTKey.emit();
  }
}
