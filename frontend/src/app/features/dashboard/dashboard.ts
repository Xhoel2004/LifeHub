import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { BudgetEntryResponse, BudgetSummaryResponse } from '../../shared/models/budget-entry.model';
import { HabitResponse } from '../../shared/models/habit.model';
import { TaskRequest, TaskResponse, TaskStatus } from '../../shared/models/task.model';
import { getDueInfo, isOverdue } from '../../shared/utils/task-date.util';
import { BudgetService } from '../budget/budget.service';
import { HabitService } from '../habits/habit.service';
import { TaskFormDrawer } from '../tasks/task-form-drawer/task-form-drawer';
import { TaskService } from '../tasks/task.service';

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
};

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, TaskFormDrawer, DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly userService = inject(UserService);
  private readonly taskService = inject(TaskService);
  private readonly habitService = inject(HabitService);
  private readonly budgetService = inject(BudgetService);
  private readonly toastService = inject(ToastService);

  readonly user = this.userService.currentUser;
  readonly firstName = computed(() => this.user()?.displayName?.split(' ')[0] ?? '');

  readonly tasks = signal<TaskResponse[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  readonly habits = signal<HabitResponse[]>([]);
  readonly habitsLoading = signal(true);
  readonly habitsError = signal(false);
  readonly togglingHabitId = signal<number | null>(null);

  readonly budgetEntries = signal<BudgetEntryResponse[]>([]);
  readonly budgetSummary = signal<BudgetSummaryResponse>({ totalIncome: 0, totalExpense: 0, net: 0 });
  readonly budgetLoading = signal(true);
  readonly budgetError = signal(false);

  readonly drawerState = signal<{ task: TaskResponse | null } | null>(null);
  readonly savingTask = signal(false);

  readonly totalTasks = computed(() => this.tasks().length);
  readonly inProgressCount = computed(() => this.tasks().filter((t) => t.status === 'IN_PROGRESS').length);
  readonly doneCount = computed(() => this.tasks().filter((t) => t.status === 'DONE').length);
  readonly overdueTasks = computed(() => this.tasks().filter(isOverdue));

  readonly upcomingTasks = computed(() =>
    this.tasks()
      .filter((t) => t.dueDate && t.status !== 'DONE' && !isOverdue(t))
      .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
      .slice(0, 4),
  );

  readonly recentTasks = computed(() =>
    [...this.tasks()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3),
  );

  readonly dueInfoFor = getDueInfo;

  readonly habitDoneCount = computed(() => this.habits().filter((h) => h.completedToday).length);
  readonly habitDonePct = computed(() => {
    const total = this.habits().length;
    return total === 0 ? 0 : Math.round((this.habitDoneCount() / total) * 100);
  });
  readonly topStreak = computed(() =>
    this.habits().reduce<HabitResponse | null>(
      (best, h) => (h.currentStreak > (best?.currentStreak ?? 0) ? h : best),
      null,
    ),
  );
  readonly habitPreview = computed(() => this.habits().slice(0, 3));

  readonly spentPct = computed(() => {
    const { totalIncome, totalExpense } = this.budgetSummary();
    return totalIncome === 0 ? 0 : Math.round((totalExpense / totalIncome) * 100);
  });
  readonly topCategories = computed(() => {
    const totals = new Map<string, number>();
    for (const entry of this.budgetEntries()) {
      if (entry.type !== 'EXPENSE') {
        continue;
      }
      totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.amount);
    }
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, amount]) => ({ category, amount }));
  });

  constructor() {
    this.loadTasks();
    this.loadHabits();
    this.loadBudget();
  }

  statusLabel(status: TaskStatus): string {
    return STATUS_LABELS[status];
  }

  retry(): void {
    this.loadTasks();
  }

  retryHabits(): void {
    this.loadHabits();
  }

  retryBudget(): void {
    this.loadBudget();
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

  toggleHabitToday(habit: HabitResponse): void {
    this.togglingHabitId.set(habit.id);
    const date = new Date().toISOString().slice(0, 10);
    const request$ = habit.completedToday
      ? this.habitService.unlogCompletion(habit.id, date)
      : this.habitService.logCompletion(habit.id, date);

    request$.subscribe({
      next: (updated) => {
        this.togglingHabitId.set(null);
        this.habits.update((current) => current.map((h) => (h.id === updated.id ? updated : h)));
      },
      error: () => {
        this.togglingHabitId.set(null);
      },
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

  private loadHabits(): void {
    this.habitsLoading.set(true);
    this.habitsError.set(false);
    this.habitService.list().subscribe({
      next: (habits) => {
        this.habits.set(habits);
        this.habitsLoading.set(false);
      },
      error: () => {
        this.habitsLoading.set(false);
        this.habitsError.set(true);
      },
    });
  }

  private loadBudget(): void {
    this.budgetLoading.set(true);
    this.budgetError.set(false);
    const month = currentMonth();

    this.budgetService.list(month).subscribe({
      next: (entries) => this.budgetEntries.set(entries),
      error: () => {},
    });

    this.budgetService.summary(month).subscribe({
      next: (summary) => {
        this.budgetSummary.set(summary);
        this.budgetLoading.set(false);
      },
      error: () => {
        this.budgetLoading.set(false);
        this.budgetError.set(true);
      },
    });
  }
}
