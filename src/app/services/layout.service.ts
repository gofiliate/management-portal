import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {

  public customizer : string = '';
  public margin: number = 0;
  public config  = {
    settings: {
      layout_type: 'ltr',
      layout_version: 'light-only',
      sidebar_type: 'compact-wrapper modern-type',
      icon: "stroke-svg",
    },
    color: {
      primary: '#33BFBF',
      secondary: '#ff6150',
    },
  };

  constructor() { }

}
