import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Menu {
  headTitle1? : string;
  headTitle2? : string;
  path? : string;
  title? : string ;
  type? : string;
  icon?: string;
  active?: boolean;
  bookmark? : boolean;
  items? : Menu[];
  level?: number;
  megaMenu?: boolean;
  children? : Menu[];
  pined?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NavService {

  public closeSidebar: boolean = false;
  public hideNav: boolean = false;
  public language: boolean = false;

  constructor() { }

  public menuItems: Menu[] = [
    {
      headTitle1: 'One True Portal'
    },
    {
      title: 'Dashboard',
      icon: 'ti-home',
      type: 'link',
      path: '/dashboard',
      bookmark: true,
      level: 1,
    },
    {
      title: 'Clients',
      icon: 'user',
      type: 'sub',
      active: false,
      level: 1,
      children: [
        { path: '/clients/overview', title: 'Client Overview', type: 'link' },
        { path: '/clients/onboarding', title: 'Onboarding', type: 'link' },

      ],
    },
    {
      title: 'Communication',
      icon: 'user',
      type: 'sub',
      active: false,
      level: 1,
      children: [
        { path: '/clients/account-details', title: 'Account Details', type: 'link' },
        { path: '/account/finance-details', title: 'Finance Details', type: 'link' },
        { path: '/account/subscription-details', title: 'Subscription Details', type: 'link' },
        { path: '/account/change-password', title: 'Change Password', type: 'link' },
      ],
    },
    {
      title: 'Financials',
      icon: 'gallery',
      type: 'sub',
      active: false,
      level: 1,
      children: [
        {
          path: '/media/text-links',
          title: 'Textlinks',
          type: 'link',
        },
        {
          path: '/media/postbacks',
          title: 'Postbacks',
          type: 'link',

        },
        {
          path: '/media/banner-adverts',
          title: 'Banner Ads',
          type: 'link',
        },
        {
          path: '/media/campaigns',
          title: 'Campaigns',
          type: 'link',
        },
      ],
    },
    {
      title: 'Documentation',
      icon: 'charts',
      type: 'sub',
      active: false,
      level: 1,
      children: [
        { path: '/reports/advanced-breakdown', title: 'Advanced Breakdown', type: 'link' },
        { path: '/reports/payments', title: 'Payments', type: 'link' },
      ],
    },
  ]

  // Array
  items = new BehaviorSubject<Menu[]>(this.menuItems);

}
