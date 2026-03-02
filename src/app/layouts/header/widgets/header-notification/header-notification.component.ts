import { Component, Input } from '@angular/core';
import { headerNotification } from '../../../../data/header';

@Component({
  selector: 'app-header-notification',
  templateUrl: './header-notification.component.html',
  styleUrl: './header-notification.component.scss'
})
export class HeaderNotificationComponent {

  @Input() notification: boolean;

  public headerNotification = headerNotification;

}
