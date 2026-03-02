import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-logged-out',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="logged-out">
      <!-- Minimal layout -->
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class LoggedOutComponent {}
