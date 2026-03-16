import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

export interface Instance {
  id: number;
  name: string;
  logo?: string;
  url?: string;
  active: boolean;
  api_endpoint?: string;
  api_key?: string;
  ad_endpoint?: string;
  ip_address?: string;
  heartbeat_port?: number;
  is_live?: number;
}

@Component({
  selector: 'app-instance-card',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './instance-card.component.html',
  styleUrl: './instance-card.component.scss'
})
export class InstanceCardComponent implements OnInit {
  @Input() instance!: Instance;
  
  public heartbeatStatus: 'checking' | 'online' | 'offline' = 'checking';
  public authStatus: 'checking' | 'authorized' | 'unauthorized' = 'checking';
  public adServerStatus: 'checking' | 'online' | 'offline' = 'checking';
  public logoError = false;
  public fallbackLogo = 'assets/images/user/user.png';

  constructor(private http: HttpClient) {}

  onLogoError(): void {
    this.logoError = true;
  }

  ngOnInit(): void {
    this.checkStatuses();
  }

  private checkStatuses(): void {
    console.log('Instance data:', this.instance);
    
    if (!this.instance.api_endpoint) {
      console.log('No api_endpoint found, skipping status checks');
      return;
    }

    // Check heartbeat
    this.checkHeartbeat();
    
    // Check authorized routes
    this.checkAuthorization();
    
    // Check Ad Server
    this.checkAdServer();
  }

  private checkHeartbeat(): void {
    const heartbeatUrl = `${this.instance.api_endpoint}/heartbeat`;
    console.log('Checking heartbeat:', heartbeatUrl);
    
    this.http.get(heartbeatUrl, { observe: 'response', responseType: 'text' }).subscribe({
      next: (response) => {
        console.log('Heartbeat response:', response.status);
        this.heartbeatStatus = (response.status >= 200 && response.status < 300) ? 'online' : 'offline';
      },
      error: (err) => {
        console.log('Heartbeat failed:', err);
        this.heartbeatStatus = 'offline';
      }
    });
  }

  private checkAuthorization(): void {
    if (!this.instance.api_key) {
      console.log('No api_key found');
      this.authStatus = 'unauthorized';
      return;
    }

    const authUrl = `${this.instance.api_endpoint}/admin/ip-restricted/integration`;
    const headers = { 'Authorization': this.instance.api_key };
    console.log('Checking authorization:', authUrl, 'with key:', this.instance.api_key);
    
    this.http.get(authUrl, { headers, observe: 'response', responseType: 'text' }).subscribe({
      next: (response) => {
        console.log('Authorization response:', response.status);
        this.authStatus = (response.status >= 200 && response.status < 300) ? 'authorized' : 'unauthorized';
      },
      error: (err) => {
        console.log('Authorization failed:', err.status, err);
        // 404 means route doesn't exist (local dev), treat as unauthorized
        this.authStatus = 'unauthorized';
      }
    });
  }

  private checkAdServer(): void {
    if (!this.instance.ad_endpoint) {
      console.log('No ad_endpoint configured');
      this.adServerStatus = 'offline';
      return;
    }

    const adServerUrl = `${this.instance.ad_endpoint}/heartbeat`;
    console.log('Checking Ad Server:', adServerUrl);
    
    this.http.get(adServerUrl, { observe: 'response', responseType: 'text' }).subscribe({
      next: (response) => {
        console.log('Ad Server response:', response.status);
        this.adServerStatus = (response.status >= 200 && response.status < 300) ? 'online' : 'offline';
      },
      error: (err) => {
        console.log('Ad Server failed:', err);
        this.adServerStatus = 'offline';
      }
    });
  }
}
