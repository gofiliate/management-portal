import { Component, Input } from '@angular/core';
import { headerMessage } from '../../../../data/header';

@Component({
  selector: 'app-header-message',
  templateUrl: './header-message.component.html',
  styleUrl: './header-message.component.scss'
})
export class HeaderMessageComponent {

  @Input() message: boolean;

  public headerMessage = headerMessage;

}
