import { Component, Input } from '@angular/core';
import { featherIcon } from '../../../data/icons/feather-icon';
import { ToastrService } from 'ngx-toastr';
import feather from 'feather-icons';

@Component({
  selector: 'app-feather-icons',
  standalone: true,
  templateUrl: './feather-icon.component.html',
  styleUrl: './feather-icon.component.scss'
})
export class FeatherIconComponent {



  public featherIcon = featherIcon;
  public details: boolean = false;
  @Input() icon: string = '';
  public val: string = '';

  constructor(private toast: ToastrService){}

  getIconSvg(): string {
    try {
      return (feather.icons as Record<string, feather.FeatherIcon>)[this.icon]?.toSvg() || '';
    } catch (e) {
      console.warn(`Feather icon '${this.icon}' not found.`);
      return '';
    }
}

  getDetails(value: string){
    this.details = true;
    this.icon = value;
    this.val = '<app-feather-icons [icon]"=' + value + '"></app-feather-icons>';
  }

  copyText(val: string){
    let selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);

    this.toast.show("Code Copied to clipboard!", "",
    {
      positionClass: 'toast-bottom-right',
      closeButton: true,
      toastClass: "alert alert-copy notify-alert",
      timeOut: 1000
    })
  }
}
