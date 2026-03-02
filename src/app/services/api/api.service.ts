import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private api = environment.api; // API base URL from environment
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // Method to get the Bearer token from localStorage
  private getBearerToken(): string | null {
    if (!this.isBrowser) return null;
    const user = localStorage.getItem('GofiliateUser');
    if (user) {
      const userObject = JSON.parse(user);
      return userObject.bearer;  // Assuming `bearer` contains the token
    }
    return null;
  }

  private getUserId(): string | null {
    if (!this.isBrowser) return null;
    const user = localStorage.getItem('GofiliateUser');
    if (user) {
      const userObject = JSON.parse(user);
      return userObject.user_id;  // Assuming `bearer` contains the token
    }
    return null;
  }

  // Helper method to properly construct endpoint URLs
  private buildEndpoint(slug: string): string {
    // Ensure there's exactly one slash between api and slug
    const base = this.api.endsWith('/') ? this.api.slice(0, -1) : this.api;
    const path = slug.startsWith('/') ? slug : `/${slug}`;
    return base + path;
  }

  getNoAuth(slug: string) {

    const endpoint = this.buildEndpoint(slug);

    return this.http.get<any>(endpoint);

  }

  // Generalized GET method to handle requests with optional user_id
  get(slug: string, use_user: boolean | null): Observable<any> {

    const token = this.getBearerToken();
    const user_id = this.getUserId();

    if (token) {
      const headers = new HttpHeaders({
        'Authorization': `${token}`
      });

      // Construct the endpoint
      let endpoint = this.buildEndpoint(slug);
      if (use_user) {
        endpoint += `/${user_id}`;  // Append user_id if it's provided
      }

      return this.http.get<any>(endpoint, { headers });
    } else {
      // Handle the case where the token is not available
      console.error('Bearer token is missing');
      throw new Error('User is not authenticated');
    }
  }

  postNoAuth(slug: string, data: any): Observable<any> {

     // Construct the endpoint
     const endpoint = this.buildEndpoint(slug);

     // Convert data to JSON
     const body = JSON.stringify(data);

     return this.http.post<any>(endpoint, body);

  }

  post(slug: string, data: any, use_user: boolean | null): Observable<any> {
    const token = this.getBearerToken();
    const user_id = this.getUserId();

    if (token) {
      const headers = new HttpHeaders({
        'Authorization': `${token}`,
        'Content-Type': 'application/json'
      });

      // Construct the endpoint
      var endpoint = this.buildEndpoint(slug);
      if (use_user) {
        endpoint += `/${user_id}`;  // Append user_id if it's provided
      }

      // Convert data to JSON
      const body = JSON.stringify(data);

      return this.http.post<any>(endpoint, body, { headers });
    } else {
      // Handle the case where the token is not available
      console.error('Bearer token is missing');
      throw new Error('User is not authenticated');
    }
  }

  put(slug: string, data: any, user_id: number): Observable<any> {
    const token = this.getBearerToken();

    if (token) {
      const headers = new HttpHeaders({
        'Authorization': `${token}`,
        'Content-Type': 'application/json'
      });

      // Construct the endpoint with user_id
      const endpoint = `${this.api}${slug}/${user_id}`;

      // Convert data to JSON
      const body = JSON.stringify(data);

      return this.http.put<any>(endpoint, body, { headers });
    } else {
      // Handle the case where the token is not available
      console.error('Bearer token is missing');
      throw new Error('User is not authenticated');
    }
  }

  getDateRange(option: number): { start_date: string; end_date: string } {
    const today = new Date();
    let start_date: Date;
    let end_date: Date;

    if (option === 0) {
      // Current month
      start_date = new Date(today.getFullYear(), today.getMonth(), 1);
      end_date = today;
    } else if (option === 1) {
      // Last month
      start_date = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end_date = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of the previous month
    } else if (option === 3) {
      // Last 60 days
      end_date = today;
      start_date = new Date(today);
      start_date.setDate(today.getDate() - 60);
    } else if (option === 4) {
      // From the first day of two months ago to today
      start_date = new Date(today.getFullYear(), today.getMonth() - 2, 1);  // First day of two months ago (September if today is November)
      end_date = today;
    } else {
      throw new Error("Invalid option. Use 0 for current month, 1 for last month, 3 for the last 60 days, or 4 for the start of two months ago to today.");
    }

    return {
      start_date: this.formatDate(start_date),
      end_date: this.formatDate(end_date)
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatValue(strVal: string): number {
    const val = parseFloat(strVal);

    if (val % 1 === 0) {
      return parseFloat(val.toFixed(0)); // Return as a whole number
    } else {
      return parseFloat(val.toFixed(2)); // Round to 2 decimal places
    }
  }





}
