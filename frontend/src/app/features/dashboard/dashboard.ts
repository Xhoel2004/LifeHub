import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TopBar } from '../../layout/top-bar/top-bar';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { TaskRequest, TaskResponse, TaskStatus } from '../../shared/models/task.model';
import { UserResponse } from '../../shared/models/user.model';
import { getDueInfo, isOverdue } from '../../shared/utils/task-date.util';
import { TaskFormDrawer } from '../tasks/task-form-drawer/task-form-drawer';
import { TaskService } from '../tasks/task.service';

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
};

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, TopBar, TaskFormDrawer],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly userService = inject(UserService);
  private readonly taskService = inject(TaskService);
  private readonly toastService = inject(ToastService);

  readonly user = signal<UserResponse | null>(null);
  readonly tasks = signal<TaskResponse[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  readonly drawerState = signal<{ task: TaskResponse | null } | null>(null);
  readonly savingTask = signal(false);

  readonly totalTasks = computed(() => this.tasks().length);
  readonly todoCount = computed(() => this.tasks().filter((t) => t.status === 'TODO').length);
  readonly inProgressCount = computed(() => this.tasks().filter((t) => t.status === 'IN_PROGRESS').length);
  readonly doneCount = computed(() => this.tasks().filter((t) => t.status === 'DONE').length);
  readonly overdueTasks = computed(() => this.tasks().filter(isOverdue));

  readonly upcomingTasks = computed(() =>
    this.tasks()
      .filter((t) => t.dueDate && t.status !== 'DONE' && !isOverdue(t))
      .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
      .slice(0, 5),
  );

  readonly recentTasks = computed(() =>
    [...this.tasks()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5),
  );

  readonly dueInfoFor = getDueInfo;

  constructor() {
    this.loadUser();
    this.loadTasks();
  }

  statusLabel(status: TaskStatus): string {
    return STATUS_LABELS[status];
  }

  retry(): void {
    this.loadTasks();
  }

  openCreate(): void {
    this.drawerState.set({ task: null });
  }

  openEdit(task: TaskResponse): void {
    this.drawerState.set({ task });
  }

  closeDrawer(): void {
    this.drawerState.set(null);
  }

  saveTask(request: TaskRequest): void {
    const editing = this.drawerState()?.task ?? null;
    this.savingTask.set(true);

    const request$ = editing
      ? this.taskService.update(editing.id, request)
      : this.taskService.create(request);

    request$.subscribe({
      next: () => {
        this.savingTask.set(false);
        this.drawerState.set(null);
        this.toastService.show(editing ? 'Task updated.' : 'Task created.');
        this.loadTasks();
      },
      error: () => {
        this.savingTask.set(false);
      },
    });
  }

  private loadUser(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => this.user.set(user),
      error: () => {},
    });
  }

  private loadTasks(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.taskService.list().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }
}
