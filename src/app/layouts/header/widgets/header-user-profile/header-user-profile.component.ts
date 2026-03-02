import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { userProfile } from '../../../../data/header';
import { Router } from '@angular/router';
import { FeatherIconComponent } from '../../../icons/feather-icon/feather-icon.component'
import { AuthService } from '../../../../services/auth.service';
import { JWTUser } from '../../../../models/jwt-user.model';

@Component({
  selector: 'app-header-user-profile',
  standalone: true,
  imports: [
    FeatherIconComponent
  ],
  templateUrl: './header-user-profile.component.html',
  styleUrl: './header-user-profile.component.scss'
})
export class HeaderUserProfileComponent {

  public user: JWTUser | null = null;
  private isBrowser: boolean;

  constructor(
    private router: Router,
    private auth: AuthService,
    @Inject(PLATFORM_ID) platformId: Object
  ){
    this.isBrowser = isPlatformBrowser(platformId);
    
    if(this.isBrowser) {
      this.user = this.auth.getSession();
    }
  }

  get profilePicture(): string {
    return this.user?.profile_picture || 'assets/images/dashboard/profile.png';
  }

  get displayName(): string {
    if (this.user?.first_name || this.user?.last_name) {
      return `${this.user.first_name} ${this.user.last_name}`.trim();
    }
    return this.user?.username || 'User';
  }

  logOut(){
    this.auth.logout();
    this.router.navigate(['/sign-in']);
  }
}
