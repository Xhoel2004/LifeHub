import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { PreferencesService } from '../../../core/services/preferences.service';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { HabitRequest, HabitResponse, HeatmapDayResponse } from '../../../shared/models/habit.model';
import { HabitService } from '../habit.service';
import { HabitFormDrawer } from '../habit-form-drawer/habit-form-drawer';

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

interface HeatmapCell {
  date: string;
  title: string;
  level: number;
}

@Component({
  selector: 'app-habits-page',
  imports: [ConfirmDialog, HabitFormDrawer],
  templateUrl: './habits-page.html',
  styleUrl: './habits-page.scss',
})
export class HabitsPage implements OnInit {
  private readonly habitService = inject(HabitService);
  private readonly toastService = inject(ToastService);
  private readonly preferencesService = inject(PreferencesService);

  readonly preferences = this.preferencesService.preferences;

  readonly weekdayLabels = WEEKDAY_LABELS;

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly habits = signal<HabitResponse[]>([]);
  readonly togglingId = signal<number | null>(null);

  readonly heatmap = signal<HeatmapDayResponse[]>([]);
  readonly heatmapLoading = signal(true);

  readonly drawerState = signal<{ habit: HabitResponse | null } | null>(null);
  readonly savingHabit = signal(false);
  readonly pendingDelete = signal<HabitResponse | null>(null);

  readonly totalHabits = computed(() => this.habits().length);
  readonly completedTodayCount = computed(() => this.habits().filter((h) => h.completedToday).length);
  readonly activeStreakCount = computed(() => this.habits().filter((h) => h.currentStreak > 0).length);
  readonly longestStreak = computed(() =>
    this.habits().reduce((max, h) => Math.max(max, h.currentStreak), 0),
  );
  readonly avgWeeklyPct = computed(() => {
    const habits = this.habits();
    if (habits.length === 0) {
      return 0;
    }
    const total = habits.reduce((sum, h) => sum + Math.min(100, Math.round((h.doneThisWeek / h.weeklyTarget) * 100)), 0);
    return Math.round(total / habits.length);
  });

  readonly heatmapCells = computed<HeatmapCell[]>(() =>
    this.heatmap().map((day) => {
      const ratio = day.total > 0 ? day.completed / day.total : 0;
      let level = 0;
      if (ratio > 0) level = 1;
      if (ratio >= 0.5) level = 2;
      if (ratio >= 0.99) level = 3;
      return {
        date: day.date,
        level,
        title: `${day.date}: ${day.completed}/${day.total} habits done`,
      };
    }),
  );

  ngOnInit(): void {
    this.load();
    this.loadHeatmap();
  }

  retry(): void {
    this.load();
  }

  weeklyPct(habit: HabitResponse): number {
    return Math.min(100, Math.round((habit.doneThisWeek / habit.weeklyTarget) * 100));
  }

  openCreate(): void {
    this.drawerState.set({ habit: null });
  }

  openEdit(habit: HabitResponse): void {
    this.drawerState.set({ habit });
  }

  closeDrawer(): void {
    this.drawerState.set(null);
  }

  saveHabit(request: HabitRequest): void {
    const editing = this.drawerState()?.habit ?? null;
    this.savingHabit.set(true);

    const request$ = editing
      ? this.habitService.update(editing.id, request)
      : this.habitService.create(request);

    request$.subscribe({
      next: () => {
        this.savingHabit.set(false);
        this.drawerState.set(null);
        this.toastService.show(editing ? 'Habit updated.' : 'Habit added.');
        this.load();
      },
      error: () => {
        this.savingHabit.set(false);
      },
    });
  }

  confirmDelete(habit: HabitResponse): void {
    if (this.preferences().skipDeleteConfirm) {
      this.deleteHabit(habit);
      return;
    }
    this.pendingDelete.set(habit);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  performDelete(): void {
    const habit = this.pendingDelete();
    if (!habit) {
      return;
    }
    this.deleteHabit(habit);
  }

  private deleteHabit(habit: HabitResponse): void {
    this.habitService.delete(habit.id).subscribe({
      next: () => {
        this.pendingDelete.set(null);
        this.toastService.show('Habit deleted.');
        this.load();
      },
      error: () => {
        this.pendingDelete.set(null);
      },
    });
  }

  toggleToday(habit: HabitResponse): void {
    this.togglingId.set(habit.id);
    const date = today();
    const request$ = habit.completedToday
      ? this.habitService.unlogCompletion(habit.id, date)
      : this.habitService.logCompletion(habit.id, date);

    request$.subscribe({
      next: (updated) => {
        this.togglingId.set(null);
        this.habits.update((current) => current.map((h) => (h.id === updated.id ? updated : h)));
        this.loadHeatmap();
      },
      error: () => {
        this.togglingId.set(null);
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.habitService.list().subscribe({
      next: (habits) => {
        this.habits.set(habits);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  private loadHeatmap(): void {
    this.heatmapLoading.set(true);
    this.habitService.getHeatmap(12).subscribe({
      next: (days) => {
        this.heatmap.set(days);
        this.heatmapLoading.set(false);
      },
      error: () => {
        this.heatmapLoading.set(false);
      },
    });
  }
}
