
import { Component } from '@angular/core';
import { SearchService } from '../../../../services/search.service';
import { FormsModule } from '@angular/forms';
import { SearchItemsComponent } from './search-items/search-items.component'

@Component({
  selector: 'app-header-search',
  standalone: true,
  imports: [
    FormsModule,
    SearchItemsComponent,

  ],
  templateUrl: './header-search.component.html',
  styleUrl: './header-search.component.scss'
})
export class HeaderSearchComponent {

  constructor(public search: SearchService){}

}

