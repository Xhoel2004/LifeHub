import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { PreferencesService } from '../../../core/services/preferences.service';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../shared/components/toast/toast.service';
import {
  BudgetEntryRequest,
  BudgetEntryResponse,
  BudgetSummaryResponse,
  MonthlyOverviewResponse,
} from '../../../shared/models/budget-entry.model';
import { BudgetService } from '../budget.service';
import { BudgetEntryFormDrawer } from '../budget-entry-form-drawer/budget-entry-form-drawer';

const CATEGORY_PALETTE = ['#8B5CF6', '#22D3EE', '#818CF8', '#F472B6', '#FBBF24', '#34D399', '#F87171', '#60A5FA'];
const MAX_CATEGORY_SLICES = 6;

function toYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(yearMonth: string, delta: number): string {
  const [year, month] = yearMonth.split('-').map(Number);
  return toYearMonth(new Date(year, month - 1 + delta, 1));
}

function monthShortLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'short' });
}

interface CategorySlice {
  name: string;
  amount: number;
  pct: number;
  color: string;
}

interface MonthBar {
  label: string;
  incomeHeightPct: number;
  expenseHeightPct: number;
  incomeLabel: string;
  expenseLabel: string;
}

@Component({
  selector: 'app-budget-page',
  imports: [ConfirmDialog, BudgetEntryFormDrawer, DecimalPipe],
  templateUrl: './budget-page.html',
  styleUrl: './budget-page.scss',
})
export class BudgetPage implements OnInit {
  private readonly budgetService = inject(BudgetService);
  private readonly toastService = inject(ToastService);
  private readonly preferencesService = inject(PreferencesService);

  readonly preferences = this.preferencesService.preferences;

  readonly currentMonth = signal(toYearMonth(new Date()));
  readonly monthLabel = computed(() => {
    const [year, month] = this.currentMonth().split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  });

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly entries = signal<BudgetEntryResponse[]>([]);
  readonly summary = signal<BudgetSummaryResponse>({ totalIncome: 0, totalExpense: 0, net: 0 });

  readonly overview = signal<MonthlyOverviewResponse[]>([]);
  readonly overviewLoading = signal(true);

  readonly drawerState = signal<{ entry: BudgetEntryResponse | null } | null>(null);
  readonly savingEntry = signal(false);
  readonly pendingDelete = signal<BudgetEntryResponse | null>(null);

  readonly spentPct = computed(() => {
    const { totalIncome, totalExpense } = this.summary();
    if (totalIncome <= 0) {
      return totalExpense > 0 ? 100 : 0;
    }
    return Math.min(100, Math.round((totalExpense / totalIncome) * 100));
  });

  readonly categorySlices = computed<CategorySlice[]>(() => {
    const expenseEntries = this.entries().filter((e) => e.type === 'EXPENSE');
    const totals = new Map<string, number>();
    for (const entry of expenseEntries) {
      totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.amount);
    }

    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const totalExpense = sorted.reduce((sum, [, amount]) => sum + amount, 0);
    if (totalExpense === 0) {
      return [];
    }

    const top = sorted.slice(0, MAX_CATEGORY_SLICES);
    const rest = sorted.slice(MAX_CATEGORY_SLICES);
    const slices: [string, number][] = [...top];
    if (rest.length > 0) {
      slices.push(['Other', rest.reduce((sum, [, amount]) => sum + amount, 0)]);
    }

    return slices.map(([name, amount], i) => ({
      name,
      amount,
      pct: Math.round((amount / totalExpense) * 1000) / 10,
      color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
    }));
  });

  readonly donutGradient = computed(() => {
    const slices = this.categorySlices();
    if (slices.length === 0) {
      return 'conic-gradient(rgba(255,255,255,0.06) 0deg 360deg)';
    }
    let cursor = 0;
    const stops: string[] = [];
    for (const slice of slices) {
      const start = cursor;
      const end = cursor + (slice.pct / 100) * 360;
      stops.push(`${slice.color} ${start}deg ${end}deg`);
      cursor = end;
    }
    if (cursor < 360) {
      stops.push(`rgba(255,255,255,0.06) ${cursor}deg 360deg`);
    }
    return `conic-gradient(${stops.join(', ')})`;
  });

  readonly monthBars = computed<MonthBar[]>(() => {
    const months = this.overview();
    const max = months.reduce((m, x) => Math.max(m, x.totalIncome, x.totalExpense), 0);
    if (max === 0) {
      return months.map((m) => ({
        label: monthShortLabel(m.yearMonth),
        incomeHeightPct: 0,
        expenseHeightPct: 0,
        incomeLabel: m.totalIncome.toFixed(2),
        expenseLabel: m.totalExpense.toFixed(2),
      }));
    }
    return months.map((m) => ({
      label: monthShortLabel(m.yearMonth),
      incomeHeightPct: Math.max(2, Math.round((m.totalIncome / max) * 100)),
      expenseHeightPct: Math.max(2, Math.round((m.totalExpense / max) * 100)),
      incomeLabel: m.totalIncome.toFixed(2),
      expenseLabel: m.totalExpense.toFixed(2),
    }));
  });

  ngOnInit(): void {
    this.load();
    this.loadOverview();
  }

  goToPreviousMonth(): void {
    this.currentMonth.set(shiftMonth(this.currentMonth(), -1));
    this.load();
  }

  goToNextMonth(): void {
    this.currentMonth.set(shiftMonth(this.currentMonth(), 1));
    this.load();
  }

  retry(): void {
    this.load();
  }

  openCreate(): void {
    this.drawerState.set({ entry: null });
  }

  openEdit(entry: BudgetEntryResponse): void {
    this.drawerState.set({ entry });
  }

  closeDrawer(): void {
    this.drawerState.set(null);
  }

  saveEntry(request: BudgetEntryRequest): void {
    const editing = this.drawerState()?.entry ?? null;
    this.savingEntry.set(true);

    const request$ = editing
      ? this.budgetService.update(editing.id, request)
      : this.budgetService.create(request);

    request$.subscribe({
      next: () => {
        this.savingEntry.set(false);
        this.drawerState.set(null);
        this.toastService.show(editing ? 'Entry updated.' : 'Entry added.');
        this.load();
        this.loadOverview();
      },
      error: () => {
        this.savingEntry.set(false);
      },
    });
  }

  confirmDelete(entry: BudgetEntryResponse): void {
    if (this.preferences().skipDeleteConfirm) {
      this.deleteEntry(entry);
      return;
    }
    this.pendingDelete.set(entry);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  performDelete(): void {
    const entry = this.pendingDelete();
    if (!entry) {
      return;
    }
    this.deleteEntry(entry);
  }

  private deleteEntry(entry: BudgetEntryResponse): void {
    this.budgetService.delete(entry.id).subscribe({
      next: () => {
        this.pendingDelete.set(null);
        this.toastService.show('Entry deleted.');
        this.load();
        this.loadOverview();
      },
      error: () => {
        this.pendingDelete.set(null);
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);

    forkJoin({
      entries: this.budgetService.list(this.currentMonth()),
      summary: this.budgetService.summary(this.currentMonth()),
    }).subscribe({
      next: ({ entries, summary }) => {
        this.entries.set(entries);
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  private loadOverview(): void {
    this.overviewLoading.set(true);
    this.budgetService.overview(6).subscribe({
      next: (overview) => {
        this.overview.set(overview);
        this.overviewLoading.set(false);
      },
      error: () => {
        this.overviewLoading.set(false);
      },
    });
  }
}
