import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { PreferencesService } from '../../../core/services/preferences.service';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../shared/components/toast/toast.service';
import {
  BILLING_CYCLE_LABELS,
  BillingCycle,
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
  SUBSCRIPTION_CATEGORY_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  SubscriptionCategory,
  SubscriptionRequest,
  SubscriptionResponse,
  SubscriptionStatus,
} from '../../../shared/models/subscription.model';
import { getRenewalInfo, monthlyEquivalent, yearlyEquivalent } from '../../../shared/utils/subscription-spend.util';
import { SubscriptionFormDrawer } from '../subscription-form-drawer/subscription-form-drawer';
import { SubscriptionService } from '../subscription.service';

const CATEGORY_PALETTE = ['#8B5CF6', '#22D3EE', '#818CF8', '#F472B6', '#FBBF24', '#34D399', '#F87171', '#60A5FA'];
const MAX_CATEGORY_SLICES = 6;

type CategoryFilter = 'all' | SubscriptionCategory;
type StatusFilter = 'all' | SubscriptionStatus;
type BillingCycleFilter = 'all' | BillingCycle;
type PaymentMethodFilter = 'all' | PaymentMethod;
type SortKey = 'name' | 'amount' | 'nextDueDate' | 'category' | 'status';
type RenewalWindow = 7 | 30;

interface CategorySlice {
  name: string;
  amount: number;
  pct: number;
  color: string;
}

@Component({
  selector: 'app-subscriptions-page',
  imports: [ConfirmDialog, SubscriptionFormDrawer, DecimalPipe],
  templateUrl: './subscriptions-page.html',
  styleUrl: './subscriptions-page.scss',
})
export class SubscriptionsPage implements OnInit {
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly toastService = inject(ToastService);
  private readonly preferencesService = inject(PreferencesService);

  readonly preferences = this.preferencesService.preferences;

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly subscriptions = signal<SubscriptionResponse[]>([]);

  readonly search = signal('');
  readonly categoryFilter = signal<CategoryFilter>('all');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly billingCycleFilter = signal<BillingCycleFilter>('all');
  readonly paymentMethodFilter = signal<PaymentMethodFilter>('all');
  readonly sortKey = signal<SortKey>('nextDueDate');

  readonly renewalWindow = signal<RenewalWindow>(7);

  readonly drawerState = signal<{ subscription: SubscriptionResponse | null } | null>(null);
  readonly savingSubscription = signal(false);
  readonly pendingDelete = signal<SubscriptionResponse | null>(null);
  readonly actioningId = signal<number | null>(null);

  readonly categoryOptions = Object.keys(SUBSCRIPTION_CATEGORY_LABELS) as SubscriptionCategory[];
  readonly billingCycleOptions = Object.keys(BILLING_CYCLE_LABELS) as BillingCycle[];
  readonly paymentMethodOptions = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];
  readonly categoryLabels = SUBSCRIPTION_CATEGORY_LABELS;
  readonly billingCycleLabels = BILLING_CYCLE_LABELS;
  readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;
  readonly statusLabels = SUBSCRIPTION_STATUS_LABELS;
  readonly getRenewalInfo = getRenewalInfo;

  readonly activeSubscriptions = computed(() => this.subscriptions().filter((s) => s.status === 'ACTIVE'));

  readonly primaryCurrency = computed(() => {
    const currencies = new Set(this.activeSubscriptions().map((s) => s.currency));
    return currencies.size === 1 ? [...currencies][0] : currencies.size === 0 ? '' : 'mixed';
  });

  readonly monthlySpend = computed(() =>
    this.activeSubscriptions().reduce((sum, s) => sum + monthlyEquivalent(s.amount, s.billingCycle), 0),
  );

  readonly yearlySpend = computed(() =>
    this.activeSubscriptions().reduce((sum, s) => sum + yearlyEquivalent(s.amount, s.billingCycle), 0),
  );

  private readonly sortedUpcoming = computed(() =>
    this.activeSubscriptions()
      .map((s) => ({ subscription: s, renewal: getRenewalInfo(s) }))
      .sort((a, b) => a.renewal.daysRemaining - b.renewal.daysRemaining),
  );

  readonly upcomingRenewals = computed(() =>
    this.sortedUpcoming().filter((r) => r.renewal.daysRemaining <= this.renewalWindow()),
  );

  readonly nextRenewal = computed(() => this.sortedUpcoming()[0] ?? null);

  readonly categorySlices = computed<CategorySlice[]>(() => {
    const totals = new Map<string, number>();
    for (const s of this.activeSubscriptions()) {
      const label = this.categoryLabels[s.category];
      totals.set(label, (totals.get(label) ?? 0) + monthlyEquivalent(s.amount, s.billingCycle));
    }

    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((sum, [, amount]) => sum + amount, 0);
    if (total === 0) {
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
      pct: Math.round((amount / total) * 1000) / 10,
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

  readonly filteredSubscriptions = computed(() => {
    const search = this.search().trim().toLowerCase();
    const category = this.categoryFilter();
    const status = this.statusFilter();
    const billingCycle = this.billingCycleFilter();
    const paymentMethod = this.paymentMethodFilter();
    const sortKey = this.sortKey();

    const filtered = this.subscriptions().filter((s) => {
      if (search && !s.name.toLowerCase().includes(search)) {
        return false;
      }
      if (category !== 'all' && s.category !== category) {
        return false;
      }
      if (status !== 'all' && s.status !== status) {
        return false;
      }
      if (billingCycle !== 'all' && s.billingCycle !== billingCycle) {
        return false;
      }
      if (paymentMethod !== 'all' && s.paymentMethod !== paymentMethod) {
        return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'amount':
          return monthlyEquivalent(b.amount, b.billingCycle) - monthlyEquivalent(a.amount, a.billingCycle);
        case 'nextDueDate':
          return a.nextDueDate.localeCompare(b.nextDueDate);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  });

  readonly filtersActive = computed(
    () =>
      this.search().trim() !== '' ||
      this.categoryFilter() !== 'all' ||
      this.statusFilter() !== 'all' ||
      this.billingCycleFilter() !== 'all' ||
      this.paymentMethodFilter() !== 'all',
  );

  ngOnInit(): void {
    this.load();
  }

  retry(): void {
    this.load();
  }

  setSearch(value: string): void {
    this.search.set(value);
  }

  setCategoryFilter(value: CategoryFilter): void {
    this.categoryFilter.set(value);
  }

  setStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
  }

  setBillingCycleFilter(value: BillingCycleFilter): void {
    this.billingCycleFilter.set(value);
  }

  setPaymentMethodFilter(value: PaymentMethodFilter): void {
    this.paymentMethodFilter.set(value);
  }

  setSortKey(value: SortKey): void {
    this.sortKey.set(value);
  }

  setRenewalWindow(value: RenewalWindow): void {
    this.renewalWindow.set(Number(value) as RenewalWindow);
  }

  clearFilters(): void {
    this.search.set('');
    this.categoryFilter.set('all');
    this.statusFilter.set('all');
    this.billingCycleFilter.set('all');
    this.paymentMethodFilter.set('all');
  }

  openCreate(): void {
    this.drawerState.set({ subscription: null });
  }

  openEdit(subscription: SubscriptionResponse): void {
    this.drawerState.set({ subscription });
  }

  closeDrawer(): void {
    this.drawerState.set(null);
  }

  saveSubscription(request: SubscriptionRequest): void {
    const editing = this.drawerState()?.subscription ?? null;
    this.savingSubscription.set(true);

    const request$ = editing
      ? this.subscriptionService.update(editing.id, request)
      : this.subscriptionService.create(request);

    request$.subscribe({
      next: () => {
        this.savingSubscription.set(false);
        this.drawerState.set(null);
        this.toastService.show(editing ? 'Subscription updated.' : 'Subscription added.');
        this.load();
      },
      error: () => {
        this.savingSubscription.set(false);
      },
    });
  }

  pause(subscription: SubscriptionResponse): void {
    this.runAction(subscription, this.subscriptionService.pause(subscription.id), 'Subscription paused.');
  }

  resume(subscription: SubscriptionResponse): void {
    this.runAction(subscription, this.subscriptionService.resume(subscription.id), 'Subscription resumed.');
  }

  cancel(subscription: SubscriptionResponse): void {
    this.runAction(subscription, this.subscriptionService.cancel(subscription.id), 'Subscription cancelled.');
  }

  confirmDelete(subscription: SubscriptionResponse): void {
    if (this.preferences().skipDeleteConfirm) {
      this.deleteSubscription(subscription);
      return;
    }
    this.pendingDelete.set(subscription);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  performDelete(): void {
    const subscription = this.pendingDelete();
    if (!subscription) {
      return;
    }
    this.deleteSubscription(subscription);
  }

  private deleteSubscription(subscription: SubscriptionResponse): void {
    this.subscriptionService.delete(subscription.id).subscribe({
      next: () => {
        this.pendingDelete.set(null);
        this.toastService.show('Subscription deleted.');
        this.load();
      },
      error: () => {
        this.pendingDelete.set(null);
      },
    });
  }

  private runAction(subscription: SubscriptionResponse, request$: Observable<SubscriptionResponse>, message: string): void {
    this.actioningId.set(subscription.id);
    request$.subscribe({
      next: (updated) => {
        this.actioningId.set(null);
        this.subscriptions.update((current) => current.map((s) => (s.id === updated.id ? updated : s)));
        this.toastService.show(message);
      },
      error: () => {
        this.actioningId.set(null);
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.subscriptionService.list().subscribe({
      next: (subscriptions) => {
        this.subscriptions.set(subscriptions);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }
}
