/*import { Routes } from '@angular/router';
import { LoggedInComponent } from '../layouts/logged-in/logged-in.component';
import { LoggedOutComponent } from '../layouts/logged-out/logged-out.component';
import { AuthGuard } from '../guards/auth.guard';
import { SignInComponent } from '../components/account/sign-in/sign-in.component';
import { DynamicDashboardLoaderComponent } from '../components/dashboards/dynamic-dashboard-loader/dynamic-dashboard-loader.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: LoggedInComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DynamicDashboardLoaderComponent }
    ]
  },
  {
    path: '',
    component: LoggedOutComponent,
    children: [
      { path: 'sign-in', component: SignInComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];*/
