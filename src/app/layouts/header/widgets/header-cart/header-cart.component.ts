import { Component, Input } from '@angular/core';
import { headerCart } from '../../../../data/header';

@Component({
  selector: 'app-header-cart',
  templateUrl: './header-cart.component.html',
  styleUrl: './header-cart.component.scss'
})
export class HeaderCartComponent {

  @Input() cart: boolean;

  public headerCart = headerCart;

  changeValue(id: number, value: number){
    this.headerCart.filter((data) => {
      if(data.id == id){
        if(value == -1){
          if(data.value > 1){
            data.value -= 1;
          }
        }else if(value == 1){
          data.value += 1;
        }
      }
    })
  }
}
