import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LayoutService } from '../../../app/services/layout.service';


@Component({
  selector: 'app-svg-icon',
  standalone: true,
  imports : [
    CommonModule
  ],

  templateUrl: './svg-icon.component.html',
  styleUrl: './svg-icon.component.scss'
})
export class SvgIconComponent {

  @Input("icon") public icon: any;
  @Input("class") public class: any;
  @Input() change: boolean = false;

  constructor(public layout: LayoutService){}

  getSvgType() {
    return document.getElementsByClassName("page-sub-header")[0].getAttribute("icon") == "stroke-svg";
  }
}
