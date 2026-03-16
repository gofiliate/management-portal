import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface Client {
  id: number;
  name: string;
  logo: string;
  website: string;
  instances: number;
  brands: number;
  live: number;
  onboarding: number;
}

@Component({
  selector: 'app-client-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-card.component.html',
  styleUrl: './client-card.component.scss'
})
export class ClientCardComponent {
  @Input() client!: Client;
}
