import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { UserService } from '../../core/services/user.service';
import { UserResponse } from '../../shared/models/user.model';
import { TaskBoard } from '../tasks/task-board/task-board';

@Component({
  selector: 'app-dashboard',
  imports: [TaskBoard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  readonly user = signal<UserResponse | null>(null);

  constructor() {
    this.userService.getCurrentUser().subscribe({
      next: (user) => this.user.set(user),
      error: () => {},
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
