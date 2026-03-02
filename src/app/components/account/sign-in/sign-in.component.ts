import { Component, OnInit } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterLink
   // BrowserAnimationsModule // Keep for animations
  ],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {
  public api_endpoint = ''; // api location
  public logo = 'assets/images/logo/client-header.png';
  public background = 'assets/images/logo/client-splash.png';
  public loginImage = 'assets/images/logo/client-header.png'; // Login image URL
  public validate: boolean = false;

  public signin = new FormGroup({
    username: new FormControl('', [
      Validators.required,
      Validators.pattern('^[a-zA-Z0-9_@.]+$'),
      Validators.minLength(3),
      Validators.maxLength(32)
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(32)
    ])
  });

  public show: boolean = false;

  constructor(private toast: ToastrService, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.api_endpoint = environment.api;
    console.log("RUNNING APPLICATION Pointing at [" + this.api_endpoint + "]");
  }

  async submit() {
    this.validate = true;
    if (!this.signin.valid) return;

    const credentials = this.signin.value as { username: string; password: string };

    this.auth.login(credentials).subscribe({
      next: (session: any) => {
        // Check if 2FA verification is required
        if (session.requires_totp) {
          this.router.navigate(['/verify-totp'], {
            state: { username: credentials.username }
          });
          return;
        }

        // Check if 2FA setup is required
        if (session.requires_totp_setup) {
          // Save temporary session with bearer token so user can call setup endpoint
          const tempSession = {
            username: session.username,
            bearer: session.bearer,
            user_id: 0,
            first_name: '',
            last_name: '',
            profile_picture: '',
            access_level: 0,
            access_label: '',
            is_god: false,
            exp: 0,
            iat: 0,
            totp_enabled: false
          };
          this.auth.saveSession(tempSession);
          this.toast.warning('Two-factor authentication setup required', '2FA Required');
          this.router.navigate(['/totp-setup']);
          return;
        }

        // Normal login success - save session
        this.auth.saveSession(session);
        this.toast.success('Successfully Logged In', 'Login Success');
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 10);
      },
      error: (err) => {
        if (err.status === 404) {
          this.toast.error('Username Not Found', 'Login Error');
        } else if (err.status === 401) {
          this.toast.error('Username and Password Don\'t Match.', 'Login Error');
        } else {
          this.toast.error('Unexpected error occurred.', 'Login Error');
        }
      }
    });
  }

  passwordToggle() {
    this.show = !this.show;
  }

  get username() {
    return this.signin.get('username');
  }

  get password() {
    return this.signin.get('password');
  }

  loginWithGoogle() {
    this.auth.loginWithGoogle().subscribe({
      next: (session: any) => {
        // Check if 2FA verification is required
        if (session.requires_totp) {
          this.router.navigate(['/verify-totp'], {
            state: { username: session.username }
          });
          return;
        }

        // Check if 2FA setup is required
        if (session.requires_totp_setup) {
          // Save temporary session with bearer token so user can call setup endpoint
          const tempSession = {
            username: session.username,
            bearer: session.bearer,
            user_id: 0,
            first_name: '',
            last_name: '',
            profile_picture: '',
            access_level: 0,
            access_label: '',
            is_god: false,
            exp: 0,
            iat: 0,
            totp_enabled: false
          };
          this.auth.saveSession(tempSession);
          this.toast.warning('Two-factor authentication setup required', '2FA Required');
          this.router.navigate(['/totp-setup']);
          return;
        }

        // Normal login success - save session
        this.auth.saveSession(session);
        this.toast.success('Successfully Logged In with Google', 'Login Success');
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 10);
      },
      error: (err) => {
        console.error('Google login error:', err);
        if (err.status === 403) {
          this.toast.error('No account found for this email address. Please contact your administrator for an invitation.', 'Account Not Found');
        } else {
          this.toast.error('An error occurred during sign-in. Please try again.', 'Login Error');
        }
      }
    });
  }
}
