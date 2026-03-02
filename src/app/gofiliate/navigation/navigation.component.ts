import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent implements OnInit {

  public navigationOptions = [
    {
      title: 'Roles',
      description: 'Manage user roles and permissions',
      icon: 'fa fa-users',
      route: '/gofiliate/navigation/roles',
      color: 'primary'
    },
    {
      title: 'Sections',
      description: 'Manage navigation sections',
      icon: 'fa fa-th-large',
      route: '/gofiliate/navigation/sections',
      color: 'success'
    },
    {
      title: 'Endpoints',
      description: 'Manage API endpoints and routes',
      icon: 'fa fa-cogs',
      route: '/gofiliate/navigation/endpoints',
      color: 'warning'
    },
    {
      title: 'API',
      description: 'Manage API configuration and access',
      icon: 'fa fa-code',
      route: '/gofiliate/navigation/api',
      color: 'info'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('Navigation component initialized');
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

}
