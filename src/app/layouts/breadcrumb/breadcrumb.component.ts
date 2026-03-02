import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, PRIMARY_OUTLET, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { FeatherIconComponent } from '../icons/feather-icon/feather-icon.component';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [
    FeatherIconComponent
  ],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent {

  public breadcrumbs: { main?: string; parentBreadcrumb?: string; childBreadcrumb?: string; subMain?: string } = {};

  public title : string = '';

  constructor(private activatedRoute : ActivatedRoute, private router : Router){

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
        let main = route.parent?.snapshot.data['main'];
        let child = route.snapshot.data['breadcrumb'];
        let subMain = route.snapshot.data['subMain']
        this.breadcrumbs =  {};
        this.title = title;
        this.breadcrumbs ={
          "main": main,
          "parentBreadcrumb" : parent,
          "childBreadcrumb" : child,
          "subMain": subMain
        }
      });
    }
}
