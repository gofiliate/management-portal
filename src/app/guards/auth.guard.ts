import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // adjust path if needed

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const session = this.auth.getSession();

    console.log('AuthGuard::session', session);

    if (!session || this.auth.isExpired(session)) {
      console.log('AuthGuard::invalid session');
      this.router.navigate(['/sign-in'], { replaceUrl: true });
      return false;
    }

    console.log('AuthGuard::valid session');
    return true;
  }
}
