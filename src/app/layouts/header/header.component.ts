import { Component, OnInit } from '@angular/core';
import { NavService } from '../../services/nav.service';
import { SearchService } from '../../services/search.service';
import { RouterModule } from '@angular/router';
import { HeaderSearchComponent } from './widgets/header-search/header-search.component';
import { SearchItemsComponent } from './widgets/header-search/search-items/search-items.component';
import { HeaderUserProfileComponent } from './widgets/header-user-profile/header-user-profile.component';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    HeaderSearchComponent,
    FormsModule,
    SearchItemsComponent,
    HeaderUserProfileComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  public logo: string | undefined; // Login image URL


  public isSearchOpen: boolean = false;
  public notification: boolean = false;
  public bookmark: boolean = false;
  public message: boolean = false;
  public cart: boolean = false;
  public profile: boolean = false;


  constructor(private navService: NavService, public search: SearchService){}

  ngOnInit(): void {

    this.loadSettings();
  }

  closeSidebar(){
    this.navService.closeSidebar =! this.navService.closeSidebar;
  }

  openSearch(){
    this.isSearchOpen =! this.isSearchOpen;
  }

  languageToggle(){
    this.navService.language =! this.navService.language;
  }

  toggle(value: string){
    if(value == 'notification'){
      this.notification =! this.notification
    }else if(value == 'bookmark'){
      this.bookmark =! this.bookmark;
    }else if(value == 'message'){
      this.message =! this.message
    }else if(value == 'cart'){
      this.cart =! this.cart;
    }else if(value == 'profile'){
      this.profile =! this.profile;
    }
  }

  async loadSettings(): Promise<void> {

  }
}
