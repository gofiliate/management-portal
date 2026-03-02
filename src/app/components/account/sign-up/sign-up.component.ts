import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterLink],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent implements OnInit {

  public api_endpoint = ''; // api location
  public logo = 'assets/images/logo/client-header.png';
  public background = 'assets/images/logo/client-splash.png';
  public loginImage = 'assets/images/logo/client-header.png'; // Login image URL
  public validate: boolean = false;
  public show: boolean = false;

  public signup = new FormGroup({
    firstName: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50)
    ]),
    lastName: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50)
    ]),
    username: new FormControl('', [
      Validators.required,
      Validators.pattern('^[a-zA-Z0-9_@.]+$'),
      Validators.minLength(3),
      Validators.maxLength(32)
    ]),
    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(32)
    ]),
    confirmPassword: new FormControl('', [
      Validators.required
    ])
  });

  constructor(
    private toast: ToastrService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.api_endpoint = environment.api;
    console.log("RUNNING SIGN-UP PAGE Pointing at [" + this.api_endpoint + "]");
  }

  async submit() {
    this.validate = true;
    if (!this.signup.valid) {
      this.toast.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    // Check if passwords match
    if (this.signup.value.password !== this.signup.value.confirmPassword) {
      this.toast.error('Passwords do not match', 'Validation Error');
      return;
    }

    const userData = {
      username: this.signup.value.username!,
      email: this.signup.value.email!,
      firstName: this.signup.value.firstName!,
      lastName: this.signup.value.lastName!,
      password: this.signup.value.password!
    };

    this.auth.register(userData).subscribe({
      next: (session) => {
        this.auth.saveSession(session);
        this.toast.success('Account created successfully!', 'Registration Success');
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 10);
      },
      error: (err) => {
        if (err.status === 409) {
          this.toast.error('Username or email already exists', 'Registration Error');
        } else if (err.status === 400) {
          this.toast.error('Invalid registration data', 'Registration Error');
        } else {
          this.toast.error('Registration failed. Please try again.', 'Registration Error');
        }
      }
    });
  }

  signUpWithGoogle() {
    this.auth.loginWithGoogle().subscribe({
      next: (session) => {
        this.auth.saveSession(session);
        this.toast.success('Account created with Google!', 'Success');
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 10);
      },
      error: (err) => {
        console.error('Google sign-up error:', err);
        this.toast.error('Google sign-up failed. Please try again.', 'Error');
      }
    });
  }

  passwordToggle() {
    this.show = !this.show;
  }

  get firstName() {
    return this.signup.get('firstName');
  }

  get lastName() {
    return this.signup.get('lastName');
  }

  get username() {
    return this.signup.get('username');
  }

  get email() {
    return this.signup.get('email');
  }

  get password() {
    return this.signup.get('password');
  }

  get confirmPassword() {
    return this.signup.get('confirmPassword');
  }
}
