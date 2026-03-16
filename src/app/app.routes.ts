import { Routes } from '@angular/router';
import { LoggedInComponent } from './layouts/logged-in/logged-in.component';
import { LoggedOutComponent } from './layouts/logged-out/logged-out.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { DynamicDashboardLoaderComponent } from './components/dashboards/dynamic-dashboard-loader/dynamic-dashboard-loader.component';
import { SignInComponent } from './components/account/sign-in/sign-in.component';
import { TotpVerifyComponent } from './components/account/totp-verify/totp-verify.component';
import { TotpSetupComponent } from './components/account/totp-setup/totp-setup.component';
import { SecuritySettingsComponent } from './components/account/security-settings/security-settings.component';import {InvitationAcceptComponent} from './components/account/invitation-accept/invitation-accept.component';import { ClientOverviewComponent } from './components/clients/client-overview/client-overview.component';
import { ClientDetailsComponent } from './components/clients/client-details/client-details.component';
import { ClientInstancesComponent } from './components/clients/client-instances/client-instances.component';
import { ClientOnboardingComponent } from './components/clients/client-onboarding/client-onboarding.component';
import { ClientDashboardComponent } from './components/clients/client-dashboard/client-dashboard.component';
import { ManageInstanceComponent } from './components/clients/manage-instance/manage-instance.component';
import { ManageInstanceOldComponent } from './components/clients/manage-instance-old/manage-instance-old.component';
import { ManageEmailsComponent } from './components/clients/manage-emails/manage-emails.component';
import { ManageTermsConditionsComponent } from './components/clients/manage-terms-conditions/manage-terms-conditions.component';
import { ManageBrandsComponent } from './components/clients/manage-brands/manage-brands.component';
import { ManageAffiliatesComponent } from './components/clients/manage-affiliates/manage-affiliates.component';
import { AffiliateDashboardComponent } from './components/clients/affiliate-dashboard/affiliate-dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { NavigationComponent } from './gofiliate/navigation/navigation.component';
import { RolesComponent } from './gofiliate/navigation/roles/roles.component';
import { RoleEditComponent } from './gofiliate/navigation/role-edit/role-edit.component';
import { SectionsComponent } from './gofiliate/navigation/sections/sections.component';
import { EndpointsComponent } from './gofiliate/navigation/endpoints/endpoints.component';
import { ApiComponent } from './gofiliate/navigation/api/api.component';
import { UsersComponent } from './gofiliate/users/users.component';
import { UserEditComponent } from './gofiliate/users/user-edit/user-edit.component';
import { PoolAccessComponent } from './gofiliate/users/pool-access/pool-access.component';
import { SettingsComponent } from './gofiliate/settings/settings.component';
import { EmailsComponent } from './gofiliate/emails/emails.component';
import { EmailEditComponent } from './gofiliate/emails/email-edit/email-edit.component';
export const routes: Routes = [
  {
    path: 'dashboard',
    component: LoggedInComponent,
    children: [
     //{ path: '', canActivate: [AuthGuard], component: DynamicDashboardLoaderComponent }
     { path: '', component: DynamicDashboardLoaderComponent }
    ]
  },
  {
    path: 'clients',
    component: LoggedInComponent,
    children: [
     { path: '', canActivate: [AuthGuard], component: ClientOverviewComponent },
     { path: 'dashboard', canActivate: [AuthGuard], component: ClientOverviewComponent },
     { path: 'details', canActivate: [AuthGuard], component: ClientDetailsComponent },
     { path: 'details/:client_id', canActivate: [AuthGuard], component: ClientDetailsComponent },
     { path: 'dashboard/:id', canActivate: [AuthGuard], component: ClientDashboardComponent },
     { path: 'instances/:id', canActivate: [AuthGuard], component: ClientInstancesComponent },
     { path: 'onboarding', canActivate: [AuthGuard], component: ClientOnboardingComponent },
     { path: 'manage-instance/:id', canActivate: [AuthGuard], component: ManageInstanceComponent },
     { path: 'manage-instance-old/:id', canActivate: [AuthGuard], component: ManageInstanceOldComponent },
    { path: 'manage-emails/:id', canActivate: [AuthGuard], component: ManageEmailsComponent },
    { path: 'manage-terms-conditions/:id', canActivate: [AuthGuard], component: ManageTermsConditionsComponent },
     { path: 'manage-brands/:id', canActivate: [AuthGuard], component: ManageBrandsComponent },
     { path: 'manage-affiliates/:id', canActivate: [AuthGuard], component: ManageAffiliatesComponent },
     { path: 'affiliate-dashboard/:uuid', canActivate: [AuthGuard], component: AffiliateDashboardComponent }
    ]
  },
  {
    path: 'gofiliate',
    component: LoggedInComponent,
    children: [
      { path: 'navigation', canActivate: [AuthGuard], component: NavigationComponent },
      { path: 'navigation/roles', canActivate: [AuthGuard], component: RolesComponent },
      { path: 'navigation/roles/:id', canActivate: [AuthGuard], component: RoleEditComponent },
      { path: 'navigation/sections', canActivate: [AuthGuard], component: SectionsComponent },
      { path: 'navigation/endpoints', canActivate: [AuthGuard], component: EndpointsComponent },
      { path: 'navigation/api', canActivate: [AuthGuard], component: ApiComponent },
      { path: 'users', canActivate: [AuthGuard], component: UsersComponent },
      { path: 'users/pool-access/:user_id', canActivate: [AuthGuard], component: PoolAccessComponent },
      { path: 'users/:user_id', canActivate: [AuthGuard], component: UserEditComponent },
      { path: 'settings', canActivate: [AuthGuard], component: SettingsComponent },
      { path: 'emails', canActivate: [AuthGuard], component: EmailsComponent },
      { path: 'emails/:email_id', canActivate: [AuthGuard], component: EmailEditComponent }
    ]
  },
  {
    path: 'account',
    component: LoggedInComponent,
    children: [
      { path: 'security', canActivate: [AuthGuard], component: SecuritySettingsComponent }
    ]
  },
  {
    path: '',
   
    component: LoggedOutComponent,
    children: [
      { path: '', component: WelcomeComponent },
      { path: 'sign-in', component: SignInComponent },
      { path: 'verify-totp', component: TotpVerifyComponent },
      { path: 'totp-setup', component: TotpSetupComponent },
      { path: '2fa/invite/:token', component: InvitationAcceptComponent }
    ]
  }
];
