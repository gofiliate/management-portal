import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ModeService {
  private api = environment.api;

  constructor() {}

  getMode(): string {
    return 'group-admin';
  }

  getApiUrl(path: string): string {
    return `${this.api}/${path}`;
  }
}
