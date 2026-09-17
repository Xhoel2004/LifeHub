import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  BILLING_CYCLE_LABELS,
  BillingCycle,
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
  SUBSCRIPTION_CATEGORY_LABELS,
  SubscriptionCategory,
  SubscriptionRequest,
  SubscriptionResponse,
} from '../../../shared/models/subscription.model';

const CATEGORY_OPTIONS = Object.keys(SUBSCRIPTION_CATEGORY_LABELS) as SubscriptionCategory[];
const BILLING_CYCLE_OPTIONS = Object.keys(BILLING_CYCLE_LABELS) as BillingCycle[];
const PAYMENT_METHOD_OPTIONS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

@Component({
  selector: 'app-subscription-form-drawer',
  imports: [ReactiveFormsModule],
  templateUrl: './subscription-form-drawer.html',
  styleUrl: './subscription-form-drawer.scss',
})
export class SubscriptionFormDrawer {
  private readonly fb = inject(FormBuilder);

  readonly editingSubscription = input<SubscriptionResponse | null>(null);
  readonly submitting = input(false);

  readonly save = output<SubscriptionRequest>();
  readonly cancelled = output<void>();

  readonly isEditMode = computed(() => this.editingSubscription() !== null);

  readonly categoryOptions = CATEGORY_OPTIONS;
  readonly billingCycleOptions = BILLING_CYCLE_OPTIONS;
  readonly paymentMethodOptions = PAYMENT_METHOD_OPTIONS;
  readonly categoryLabels = SUBSCRIPTION_CATEGORY_LABELS;
  readonly billingCycleLabels = BILLING_CYCLE_LABELS;
  readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    category: ['ENTERTAINMENT' as SubscriptionCategory, Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    currency: ['EUR', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
    billingCycle: ['MONTHLY' as BillingCycle, Validators.required],
    nextDueDate: [new Date().toISOString().slice(0, 10), Validators.required],
    paymentMethod: ['CREDIT_CARD' as PaymentMethod, Validators.required],
    notes: [''],
  });

  constructor() {
    effect(() => {
      const sub = this.editingSubscription();
      if (sub) {
        this.form.patchValue({
          name: sub.name,
          category: sub.category,
          amount: sub.amount,
          currency: sub.currency,
          billingCycle: sub.billingCycle,
          nextDueDate: sub.nextDueDate,
          paymentMethod: sub.paymentMethod,
          notes: sub.notes ?? '',
        });
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.save.emit({
      name: raw.name.trim(),
      category: raw.category,
      amount: raw.amount,
      currency: raw.currency.trim().toUpperCase(),
      billingCycle: raw.billingCycle,
      nextDueDate: raw.nextDueDate,
      paymentMethod: raw.paymentMethod,
      notes: raw.notes.trim() ? raw.notes.trim() : null,
    });
  }
}
