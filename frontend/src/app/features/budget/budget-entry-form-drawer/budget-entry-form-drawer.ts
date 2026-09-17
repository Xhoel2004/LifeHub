import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BudgetEntryRequest, BudgetEntryResponse } from '../../../shared/models/budget-entry.model';

const SUGGESTED_CATEGORIES = [
  'Salary',
  'Food',
  'Rent',
  'Transport',
  'Utilities',
  'Entertainment',
  'Health',
  'Shopping',
  'Other',
];

@Component({
  selector: 'app-budget-entry-form-drawer',
  imports: [ReactiveFormsModule],
  templateUrl: './budget-entry-form-drawer.html',
  styleUrl: './budget-entry-form-drawer.scss',
})
export class BudgetEntryFormDrawer {
  private readonly fb = inject(FormBuilder);

  readonly editingEntry = input<BudgetEntryResponse | null>(null);
  readonly submitting = input(false);

  readonly save = output<BudgetEntryRequest>();
  readonly cancelled = output<void>();

  readonly isEditMode = computed(() => this.editingEntry() !== null);
  readonly suggestedCategories = SUGGESTED_CATEGORIES;

  readonly form = this.fb.nonNullable.group({
    type: ['EXPENSE' as BudgetEntryResponse['type'], Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    category: ['', [Validators.required, Validators.maxLength(50)]],
    description: [''],
    entryDate: [new Date().toISOString().slice(0, 10), Validators.required],
  });

  constructor() {
    effect(() => {
      const entry = this.editingEntry();
      if (entry) {
        this.form.patchValue({
          type: entry.type,
          amount: entry.amount,
          category: entry.category,
          description: entry.description ?? '',
          entryDate: entry.entryDate,
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
      type: raw.type,
      amount: raw.amount,
      category: raw.category.trim(),
      description: raw.description.trim() ? raw.description.trim() : null,
      entryDate: raw.entryDate,
    });
  }
}
