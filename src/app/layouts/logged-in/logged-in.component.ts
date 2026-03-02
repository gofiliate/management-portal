import { Component, HostListener, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavService } from '../../services/nav.service';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../../services/layout.service';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-logged-in',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    BreadcrumbComponent,
    RouterOutlet
  ],
  templateUrl: './logged-in.component.html',
  styleUrl: './logged-in.component.scss'
})
export class LoggedInComponent implements  OnInit{

  public footerLight = false;
  public footerDark = false;
  public footerFix = false;
  private isBrowser: boolean;

  ngOnInit(): void {
    console.log("Loading the Layout...")
  }

  constructor(
    public navService: NavService, 
    public layout: LayoutService,
    @Inject(PLATFORM_ID) platformId: Object
  ){
    this.isBrowser = isPlatformBrowser(platformId);
    
    if(this.isBrowser && window.innerWidth < 1185){
      navService.closeSidebar = true;
    }

    if(this.isBrowser && window.innerWidth <= 992){
      this.layout.config.settings.sidebar_type = 'compact-wrapper modern-type'
    }else{
      this.layout.config.settings.sidebar_type = this.layout.config.settings.sidebar_type;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    if(!this.isBrowser) return;
    
    if(window.innerWidth < 1185){
      this.navService.closeSidebar = true;
    }else {
      this.navService.closeSidebar = false;
    }

    if(window.innerWidth <= 992){
      this.layout.config.settings.sidebar_type = 'compact-wrapper modern-type';
    }else{
      this.layout.config.settings.sidebar_type = this.layout.config.settings.sidebar_type;
    }
  }


}
