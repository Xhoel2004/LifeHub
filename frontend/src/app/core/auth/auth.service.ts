import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../../shared/models/auth.model';
import { UserService } from '../services/user.service';

const TOKEN_KEY = 'lifehub_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  private readonly tokenSignal = signal<string | null>(this.readStoredToken());
  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);

  get token(): string | null {
    return this.tokenSignal();
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, request)
      .pipe(tap((response) => this.setToken(response.token)));
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, request)
      .pipe(tap((response) => this.setToken(response.token)));
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.removeStoredToken();
    this.userService.clearCurrentUser();
    this.router.navigateByUrl('/login');
  }

  private setToken(token: string): void {
    this.tokenSignal.set(token);
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // localStorage unavailable (private browsing, storage disabled): the in-memory
      // signal still works for this page load, it just won't survive a refresh.
    }
  }

  private readStoredToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private removeStoredToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // nothing to do: see setToken
    }
  }
}
