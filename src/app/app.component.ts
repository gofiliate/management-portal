import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoginModalComponent } from './components/shared/login-modal/login-modal.component';
import { ReAuthService } from './services/re-auth.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoginModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'one-true-portal';
  showReAuthModal = false;
  currentUsername = '';
  private modalSubscription?: Subscription;

  constructor(
    private reAuthService: ReAuthService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Subscribe to modal state changes
    this.modalSubscription = this.reAuthService.showModal$.subscribe(show => {
      this.showReAuthModal = show;
      if (show) {
        // Get the current username to display in the modal
        const currentSession = this.authService.getSession();
        this.currentUsername = currentSession?.username || '';
      }
    });
  }

  ngOnDestroy(): void {
    this.modalSubscription?.unsubscribe();
  }

  onReAuthenticate(event: { username: string; password: string }): void {
    // Get the stored username to ensure they're re-authenticating as the same user
    const currentSession = this.authService.getSession();
    const storedUsername = currentSession?.username || '';
    
    // Use the stored username, not what they typed (to prevent switching users)
    this.reAuthService.submitCredentials({
      username: storedUsername || event.username,
      password: event.password
    });
  }

  onReAuthCancel(): void {
    this.reAuthService.cancelReAuth();
  }
}
