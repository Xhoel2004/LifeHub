import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { UserService } from '../../core/services/user.service';
import { UserResponse } from '../../shared/models/user.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  readonly user = signal<UserResponse | null>(null);
  readonly loading = signal(true);

  constructor() {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
