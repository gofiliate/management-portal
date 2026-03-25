import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface InfoPanelConfig {
  background_color?: string;
  header_text?: string;
  content_text?: string;
  text_color?: string;
  border_color?: string;
}

@Component({
  selector: 'app-info-panel-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-panel-widget.component.html',
  styleUrl: './info-panel-widget.component.scss'
})
export class InfoPanelWidgetComponent implements OnInit {
  @Input() widgetData: any;

  config: InfoPanelConfig = {};
  
  // Default values
  defaultBackgroundColor = '#f8f9fa';
  defaultTextColor = '#212529';
  defaultBorderColor = '#dee2e6';
  defaultHeaderText = 'Information';
  defaultContentText = 'Widget content goes here.';

  ngOnInit(): void {
    console.log('InfoPanelWidget initialized with data:', this.widgetData);
    this.parseConfig();
  }

  private parseConfig(): void {
    if (this.widgetData?.widget_config) {
      try {
        this.config = typeof this.widgetData.widget_config === 'string' 
          ? JSON.parse(this.widgetData.widget_config) 
          : this.widgetData.widget_config;
        console.log('Parsed info panel config:', this.config);
      } catch (e) {
        console.error('Failed to parse widget_config:', e);
        this.config = {};
      }
    }
  }

  get backgroundColor(): string {
    return this.config.background_color || this.defaultBackgroundColor;
  }

  get textColor(): string {
    return this.config.text_color || this.defaultTextColor;
  }

  get borderColor(): string {
    return this.config.border_color || this.defaultBorderColor;
  }

  get headerText(): string {
    return this.config.header_text || this.widgetData?.header || this.defaultHeaderText;
  }

  get contentText(): string {
    return this.config.content_text || this.defaultContentText;
  }

  get iconClass(): string {
    return this.widgetData?.icon || 'fa-info-circle';
  }
}
