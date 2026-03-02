import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, Observable, firstValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';

export interface ReAuthRequest {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReAuthService {
  private showModalSubject = new BehaviorSubject<boolean>(false);
  private reAuthResponseSubject = new Subject<ReAuthRequest | null>();
  private pendingRequestUsername: string | null = null;

  public showModal$ = this.showModalSubject.asObservable();

  constructor() {}

  /**
   * Show the re-auth modal and return a promise that resolves when user submits credentials
   */
  public requestReAuth(currentUsername: string): Promise<ReAuthRequest | null> {
    this.pendingRequestUsername = currentUsername;
    this.showModalSubject.next(true);
    
    return firstValueFrom(
      this.reAuthResponseSubject.pipe(
        filter(response => response !== undefined),
        take(1)
      )
    );
  }

  /**
   * Called when user submits credentials in the modal
   */
  public submitCredentials(credentials: ReAuthRequest): void {
    this.showModalSubject.next(false);
    this.reAuthResponseSubject.next(credentials);
    this.pendingRequestUsername = null;
  }

  /**
   * Called when user cancels the modal
   */
  public cancelReAuth(): void {
    this.showModalSubject.next(false);
    this.reAuthResponseSubject.next(null);
    this.pendingRequestUsername = null;
  }

  /**
   * Get the username from the pending request (to pre-fill the modal)
   */
  public getPendingUsername(): string | null {
    return this.pendingRequestUsername;
  }
}
