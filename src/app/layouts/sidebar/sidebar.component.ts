import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Menu, NavService } from '../../services/nav.service';
import { NavigationEnd, Router } from '@angular/router';
import { LayoutService } from '../../services/layout.service';
import { FeatherIconComponent } from '../icons/feather-icon/feather-icon.component';
import { NavigationService, NavigationItem } from '../../services/navigation/navigation.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    FeatherIconComponent
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {

  public menu: Menu[] = [];
  public menuItems: Menu[] = [];
  public pinList: Menu[] = [];
  public isLoadingNav: boolean = false;

  public margin: number = 0;
  public leftArrow: boolean = false;
  public rightArrow: boolean = true;

  constructor(
    private navService: NavService, 
    private router: Router, 
    public layout: LayoutService,
    private navigationService: NavigationService
  ){

    // Listen to route changes for active state
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.menu.forEach(item => {
          if (item.path === event.url) {
            this.setNavActive(item);
          }
          if (!item.children) { return; }
          item.children.forEach(subItem => {
            if (subItem.path === event.url) {
              this.setNavActive(subItem);
            }
            if (!subItem.children) { return; }
            subItem.children.forEach(subSubItem => {
              if (subSubItem.path === event.url) {
                this.setNavActive(subSubItem);
              }
            });
          });
        });
      }
    });
  }

  ngOnInit(): void {
    // Fetch navigation from API
    this.isLoadingNav = true;
    this.navigationService.getNavigation().subscribe({
      next: (response) => {
        if (response.result && response.navigation) {
          console.log('Navigation API Response:', response);
          
          // Transform API navigation to Menu structure
          this.menu = this.transformNavigationToMenu(response.navigation);
          this.menuItems = this.menu;
          
          console.log('Final Menu Structure:', this.menu);
        }
        this.isLoadingNav = false;
      },
      error: (error) => {
        console.error('Failed to load navigation from API:', error);
        // Empty menu on error (Dashboard is hardcoded in HTML)
        this.menu = [];
        this.menuItems = [];
        this.isLoadingNav = false;
      }
    });
  }

  private transformNavigationToMenu(navigationItems: NavigationItem[]): Menu[] {
    // Group items by section
    const sections = new Map<number, { section: any, endpoints: NavigationItem[] }>();
    
    navigationItems.forEach(item => {
      if (!sections.has(item.section_id)) {
        sections.set(item.section_id, {
          section: {
            id: item.section_id,
            name: item.section_name,
            icon: item.section_icon
          },
          endpoints: []
        });
      }
      sections.get(item.section_id)?.endpoints.push(item);
    });

    // Transform to Menu structure
    const menu: Menu[] = [];
    
    sections.forEach((data, sectionId) => {
      // Only include items marked for navigation
      const visibleEndpoints = data.endpoints
        .filter(ep => ep.in_navigation)
        .sort((a, b) => a.endpoint_order - b.endpoint_order);

      if (visibleEndpoints.length > 0) {
        const children: Menu[] = visibleEndpoints.map(endpoint => ({
          path: endpoint.path,
          title: endpoint.endpoint_name,
          type: 'link',
          level: 2
        }));

        menu.push({
          title: data.section.name,
          icon: data.section.icon || 'layout',
          type: 'sub',
          active: false,
          level: 1,
          children: children
        });
      }
    });

    return menu;
  }

  setNavActive(items: Menu) {
    this.menuItems.filter(menuItem => {
      if (menuItem !== items) {
        menuItem.active = false;
      }
      if (menuItem.children && menuItem.children.includes(items)) {
        menuItem.active = true;
      }
      if (menuItem.children) {
        menuItem.children.filter(submenuItems => {
          if (submenuItems.children && submenuItems.children.includes(items)) {
            menuItem.active = true;
            submenuItems.active = true;
          }
        });
      }
    });
  }

  toggleMenu(item: Menu) {
    if (!item.active) {
      this.menu.forEach((menu) => {
        // Top-level menu item
        if (this.menu.includes(item)) {
          menu.active = false;
        }

        // First-level children
        if (menu.children) {
          menu.children.forEach((subMenu) => {
            if (menu.children?.includes(item)) {
              subMenu.active = false;
            }

            // Second-level children
            if (subMenu.children) {
              subMenu.children.forEach((data) => {
                if (subMenu.children?.includes(item)) {
                  data.active = false;
                }
              });
            }
          });
        }
      });
    }

    // Toggle the selected item
    item.active = !item.active;
  }

  closeSidebar() {
    this.navService.closeSidebar = true;
  }

  scrollLeft() {
    this.rightArrow = true;
    if (this.layout.margin != 0) {
      this.layout.margin = this.layout.margin + 500;
    }
    if (this.layout.margin == 0) {
      this.leftArrow = false;
    }
  }

  scrollRight() {
    this.leftArrow = true;
    if (this.layout.margin != -3500) {
      this.layout.margin = this.layout.margin - 500;
    }
    if (this.layout.margin == -3500) {
      this.rightArrow = false;
    }
  }

  pined(item: Menu) {
    if (!item.pined) {
      this.menu.filter((data) => {
        if (data.title) {
          if (this.menu.includes(item)) {
            item.pined = true;
            if (!this.pinList.includes(item)) {
              this.pinList.push(item);
            }
          }
        }
      })
    } else {
      item.pined = false;
      this.pinList.splice(this.pinList.indexOf(item), 1)
    }
  }

  ngOnChanges() {
    if (this.layout.config.settings.sidebar_type == 'compact-wrapper modern-type') {
      this.margin = 0
    }
  }
} 