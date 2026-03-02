import { Component } from '@angular/core';
import { NavService } from '../../../../services/nav.service';
import { languages } from '../../../../data/header';
import { language } from '../../../../interface/header';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header-language',
  templateUrl: './header-language.component.html',
  styleUrl: './header-language.component.scss'
})
export class HeaderLanguageComponent {

  public languages = languages;
  public selectedLanguage: language;

  constructor(public navService: NavService,private translate: TranslateService){
    this.languages.filter((data) => {
      if(data.active){
        this.selectedLanguage = data
      }
    })
  }

  changeLanguage(item: language){
    this.selectedLanguage = item;
    this.translate.use(item.code)
  }
}
