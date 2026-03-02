import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../../../../services/search.service';
import { SvgIconComponent } from '../../../../svg-icon/svg-icon.component'

@Component({
  selector: 'app-search-items',
  standalone: true,
  imports: [
    CommonModule,
    SvgIconComponent,
    RouterLink
  ],
  templateUrl: './search-items.component.html',
  styleUrl: './search-items.component.scss'
})
export class SearchItemsComponent {

  constructor(public search: SearchService){

  }
}
