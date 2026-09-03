import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TopBar } from '../../../layout/top-bar/top-bar';
import { UserService } from '../../../core/services/user.service';
import { UserResponse } from '../../../shared/models/user.model';
import { TaskBoard } from '../task-board/task-board';

@Component({
  selector: 'app-task-board-page',
  imports: [TopBar, TaskBoard, RouterLink],
  templateUrl: './task-board-page.html',
  styleUrl: './task-board-page.scss',
})
export class TaskBoardPage {
  private readonly userService = inject(UserService);

  readonly user = signal<UserResponse | null>(null);

  constructor() {
    this.userService.getCurrentUser().subscribe({
      next: (user) => this.user.set(user),
      error: () => {},
    });
  }
}
