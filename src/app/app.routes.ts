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
import { OnboardingRequestsListComponent } from './components/clients/onboarding-requests-list/onboarding-requests-list.component';
import { OnboardingRequestDetailComponent } from './components/clients/onboarding-request-detail/onboarding-request-detail.component';
import { CreateOnboardingRequestComponent } from './components/clients/create-onboarding-request/create-onboarding-request.component';
import { SectionCompletionFormComponent } from './components/clients/section-completion-form/section-completion-form.component';
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
import { DashboardsWidgetsComponent } from './gofiliate/dashboards-widgets/dashboards-widgets.component';
import { TemplatesComponent } from './gofiliate/dashboards-widgets/templates/templates.component';
import { WidgetsComponent } from './gofiliate/dashboards-widgets/widgets/widgets.component';
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
    data: { title: 'Dashboard', main: 'Home' },
    children: [
     //{ path: '', canActivate: [AuthGuard], component: DynamicDashboardLoaderComponent }
     { path: '', component: DynamicDashboardLoaderComponent, data: { title: 'Dashboard' } }
    ]
  },
  {
    path: 'clients',
    component: LoggedInComponent,
    data: { title: 'Clients', main: 'Home', breadcrumb: 'Clients', mainUrl: '/dashboard' },
    children: [
     { path: '', canActivate: [AuthGuard], component: ClientOverviewComponent, data: { title: 'Client Overview', breadcrumb: 'Overview' } },
     { path: 'dashboard', canActivate: [AuthGuard], component: ClientOverviewComponent, data: { title: 'Client Overview', breadcrumb: 'Overview' } },
     { path: 'details', canActivate: [AuthGuard], component: ClientDetailsComponent, data: { title: 'Client Details', breadcrumb: 'Details' } },
     { path: 'details/:client_id', canActivate: [AuthGuard], component: ClientDetailsComponent, data: { title: 'Client Details', breadcrumb: 'Details' } },
     { path: 'dashboard/:id', canActivate: [AuthGuard], component: ClientDashboardComponent, data: { title: 'Client Dashboard', breadcrumb: 'Dashboard', breadcrumbUrl: '/clients' } },
     { path: 'instances/:id', canActivate: [AuthGuard], component: ClientInstancesComponent, data: { title: 'Client Instances', breadcrumb: 'Instances' } },
     { path: 'onboarding', canActivate: [AuthGuard], component: ClientOnboardingComponent, data: { title: 'Client Onboarding', breadcrumb: 'Onboarding' } },
     { path: 'onboarding/new', canActivate: [AuthGuard], component: CreateOnboardingRequestComponent, data: { title: 'New Request', breadcrumb: 'New', breadcrumbUrl: '/clients/onboarding' } },
     { path: 'onboarding/requests', canActivate: [AuthGuard], component: OnboardingRequestsListComponent, data: { title: 'Onboarding Requests', breadcrumb: 'Requests', breadcrumbUrl: '/clients/onboarding' } },
     { path: 'onboarding/requests/:id', canActivate: [AuthGuard], component: OnboardingRequestDetailComponent, data: { title: 'Request Details', breadcrumb: 'Details', breadcrumbUrl: '/clients/onboarding/requests' } },
     { path: 'onboarding/requests/:requestId/sections/:sectionId', canActivate: [AuthGuard], component: SectionCompletionFormComponent, data: { title: 'Complete Section', breadcrumb: 'Complete' } },
     { path: 'manage-instance/:id', canActivate: [AuthGuard], component: ManageInstanceComponent, data: { title: 'Manage Instance', breadcrumb: 'Manage Instance' } },
     { path: 'manage-instance-old/:id', canActivate: [AuthGuard], component: ManageInstanceOldComponent, data: { title: 'Manage Instance (Legacy)', breadcrumb: 'Manage Instance' } },
    { path: 'manage-emails/:id', canActivate: [AuthGuard], component: ManageEmailsComponent, data: { title: 'Manage Emails', breadcrumb: 'Emails' } },
    { path: 'manage-terms-conditions/:id', canActivate: [AuthGuard], component: ManageTermsConditionsComponent, data: { title: 'Terms & Conditions', breadcrumb: 'Terms' } },
     { path: 'manage-brands/:id', canActivate: [AuthGuard], component: ManageBrandsComponent, data: { title: 'Manage Brands', breadcrumb: 'Brands' } },
     { path: 'manage-affiliates/:id', canActivate: [AuthGuard], component: ManageAffiliatesComponent, data: { title: 'Manage Affiliates', breadcrumb: 'Affiliates' } },
     { path: 'affiliate-dashboard/:uuid', canActivate: [AuthGuard], component: AffiliateDashboardComponent, data: { title: 'Affiliate Dashboard', breadcrumb: 'Affiliate' } }
    ]
  },
  {
    path: 'gofiliate',
    component: LoggedInComponent,
    data: { title: 'Gofiliate', main: 'Home', breadcrumb: 'Gofiliate', mainUrl: '/dashboard' },
    children: [
      { path: 'navigation', canActivate: [AuthGuard], component: NavigationComponent, data: { title: 'Navigation Management', breadcrumb: 'Navigation' } },
      { path: 'navigation/roles', canActivate: [AuthGuard], component: RolesComponent, data: { title: 'Roles', breadcrumb: 'Roles', breadcrumbUrl: '/gofiliate/navigation' } },
      { path: 'navigation/roles/:id', canActivate: [AuthGuard], component: RoleEditComponent, data: { title: 'Edit Role', breadcrumb: 'Edit', breadcrumbUrl: '/gofiliate/navigation/roles' } },
      { path: 'navigation/sections', canActivate: [AuthGuard], component: SectionsComponent, data: { title: 'Sections', breadcrumb: 'Sections', breadcrumbUrl: '/gofiliate/navigation' } },
      { path: 'navigation/endpoints', canActivate: [AuthGuard], component: EndpointsComponent, data: { title: 'Endpoints', breadcrumb: 'Endpoints', breadcrumbUrl: '/gofiliate/navigation' } },
      { path: 'navigation/api', canActivate: [AuthGuard], component: ApiComponent, data: { title: 'API', breadcrumb: 'API', breadcrumbUrl: '/gofiliate/navigation' } },
      { path: 'dashboards-widgets', canActivate: [AuthGuard], component: DashboardsWidgetsComponent, data: { title: 'Dashboards & Widgets', breadcrumb: 'Dashboards & Widgets' } },
      { path: 'dashboards-widgets/templates', canActivate: [AuthGuard], component: TemplatesComponent, data: { title: 'Dashboard Templates', breadcrumb: 'Templates', breadcrumbUrl: '/gofiliate/dashboards-widgets' } },
      { path: 'dashboards-widgets/widgets', canActivate: [AuthGuard], component: WidgetsComponent, data: { title: 'Dashboard Widgets', breadcrumb: 'Widgets', breadcrumbUrl: '/gofiliate/dashboards-widgets' } },
      { path: 'users', canActivate: [AuthGuard], component: UsersComponent, data: { title: 'Users', breadcrumb: 'Users' } },
      { path: 'users/pool-access/:user_id', canActivate: [AuthGuard], component: PoolAccessComponent, data: { title: 'Pool Access', breadcrumb: 'Pool Access', breadcrumbUrl: '/gofiliate/users' } },
      { path: 'users/:user_id', canActivate: [AuthGuard], component: UserEditComponent, data: { title: 'Edit User', breadcrumb: 'Edit', breadcrumbUrl: '/gofiliate/users' } },
      { path: 'settings', canActivate: [AuthGuard], component: SettingsComponent, data: { title: 'Settings', breadcrumb: 'Settings' } },
      { path: 'emails', canActivate: [AuthGuard], component: EmailsComponent, data: { title: 'Emails', breadcrumb: 'Emails' } },
      { path: 'emails/:email_id', canActivate: [AuthGuard], component: EmailEditComponent, data: { title: 'Edit Email', breadcrumb: 'Edit', breadcrumbUrl: '/gofiliate/emails' } }
    ]
  },
  {
    path: 'account',
    component: LoggedInComponent,
    data: { title: 'Account', main: 'Home', breadcrumb: 'Account', mainUrl: '/dashboard' },
    children: [
      { path: 'security', canActivate: [AuthGuard], component: SecuritySettingsComponent, data: { title: 'Security Settings', breadcrumb: 'Security' } }
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
