import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, PRIMARY_OUTLET, Router } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent {

  public breadcrumbs: { 
    main?: string; 
    mainUrl?: string;
    parentBreadcrumb?: string; 
    parentUrl?: string;
    childBreadcrumb?: string; 
    subMain?: string 
  } = {};

  public title : string = '';

  constructor(
    private activatedRoute : ActivatedRoute, 
    private router : Router,
    private location: Location
  ){

      this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .pipe(map(() => this.activatedRoute))
      .pipe(map((route) => {
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }))
      .pipe(filter(route => route.outlet === PRIMARY_OUTLET))
      .subscribe(route => {
        let snapshot = this.router.routerState.snapshot;
        let title = route.snapshot.data['title'];
        let parent = route.parent?.snapshot.data['breadcrumb'];
        let parentUrl = route.parent?.snapshot.data['breadcrumbUrl'];
        let main = route.parent?.snapshot.data['main'];
        let mainUrl = route.parent?.snapshot.data['mainUrl'] || '/dashboard';
        let child = route.snapshot.data['breadcrumb'];
        let subMain = route.snapshot.data['subMain']
        this.breadcrumbs =  {};
        this.title = title;
        this.breadcrumbs ={
          "main": main,
          "mainUrl": mainUrl,
          "parentBreadcrumb" : parent,
          "parentUrl": parentUrl,
          "childBreadcrumb" : child,
          "subMain": subMain
        }
        
        // Debug logging
        console.log('Breadcrumb Component - Route Data:', {
          title: this.title,
          breadcrumbs: this.breadcrumbs,
          routeData: route.snapshot.data,
          parentData: route.parent?.snapshot.data
        });
      });
    }

  /**
   * Navigate to home/dashboard
   */
  navigateToHome(): void {
    this.router.navigate([this.breadcrumbs.mainUrl || '/dashboard']);
  }

  /**
   * Navigate to parent breadcrumb or go back
   */
  navigateToParent(): void {
    if (this.breadcrumbs.parentUrl) {
      this.router.navigate([this.breadcrumbs.parentUrl]);
    } else {
      this.location.back();
    }
  }

  /**
   * Simple back navigation
   */
  goBack(): void {
    this.location.back();
  }
}
