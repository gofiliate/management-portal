import { Component } from '@angular/core';
import { LayoutService } from '../../../../services/layout.service';

@Component({
  selector: 'app-header-theme-mode',
  templateUrl: './header-theme-mode.component.html',
  styleUrl: './header-theme-mode.component.scss'
})
export class HeaderThemeModeComponent {

  public dark:boolean = this.layout.config.settings.layout_version == 'dark-only' ? true : false;

  constructor(private layout: LayoutService){}

  toggle(){
    this.dark =! this.dark;
    if(this.dark){
      document.body.classList.add('dark-only');
      this.layout.config.settings.layout_version = 'dark-only';
    }else{
      document.body.classList.remove('dark-only');
      this.layout.config.settings.layout_version = 'light-only';
    }
  }
}
