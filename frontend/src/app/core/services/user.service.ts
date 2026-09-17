import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UpdateProfileRequest, UserResponse } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  private readonly userSignal = signal<UserResponse | null>(null);
  readonly currentUser = this.userSignal.asReadonly();

  /** Fetches the current user from the API and caches it in `currentUser`. */
  fetchCurrentUser(): Observable<UserResponse> {
    return this.http
      .get<UserResponse>(`${environment.apiUrl}/users/me`)
      .pipe(tap((user) => this.userSignal.set(user)));
  }

  updateProfile(request: UpdateProfileRequest): Observable<UserResponse> {
    return this.http
      .put<UserResponse>(`${environment.apiUrl}/users/me`, request)
      .pipe(tap((user) => this.userSignal.set(user)));
  }

  clearCurrentUser(): void {
    this.userSignal.set(null);
  }
}
