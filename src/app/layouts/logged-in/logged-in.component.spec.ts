import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-logged-in',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="logged-in">
      <!-- Add your sidebar/header here -->
      <nav>Logged In Navigation</nav>
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class LoggedInComponent {}
