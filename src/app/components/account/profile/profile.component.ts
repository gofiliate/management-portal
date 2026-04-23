import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { GofiliateService } from '../../../services/gofiliate.service';
import { JWTUser } from '../../../models/jwt-user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: JWTUser | null = null;
  clientAccess: any[] = [];
  instanceAccess: any[] = [];
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private gofiliateService: GofiliateService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getSession();
    if (this.user && !this.user.is_god) {
      this.loadAccess();
    }
  }

  getFullName(): string {
    if (!this.user) return '';
    return `${this.user.first_name} ${this.user.last_name}`.trim() || this.user.username;
  }

  getInitials(): string {
    if (!this.user) return '';
    if (this.user.first_name && this.user.last_name) {
      return `${this.user.first_name.charAt(0)}${this.user.last_name.charAt(0)}`.toUpperCase();
    }
    return this.user.username.charAt(0).toUpperCase();
  }

  loadAccess(): void {
    if (!this.user) return;
    
    this.loading = true;
    this.gofiliateService.getPoolAccess('me').subscribe({
      next: (response) => {
        this.clientAccess = response.client_access || [];
        this.instanceAccess = response.instance_access || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading access permissions:', error);
        this.loading = false;
      }
    });
  }
}
