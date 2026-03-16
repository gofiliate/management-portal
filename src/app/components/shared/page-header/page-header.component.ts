import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface PageHeaderButton {
  text: string;
  icon: string;
  show?: boolean;
  class?: string;
  fn?: () => void;
}

export interface BreadcrumbItem {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss'
})
export class PageHeaderComponent {
  @Input() title!: string;
  @Input() breadcrumbs: BreadcrumbItem[] = [];
  @Input() headerButtons?: PageHeaderButton[];
}
