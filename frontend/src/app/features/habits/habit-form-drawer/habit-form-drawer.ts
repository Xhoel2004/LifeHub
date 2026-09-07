import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HabitRequest, HabitResponse } from '../../../shared/models/habit.model';

@Component({
  selector: 'app-habit-form-drawer',
  imports: [ReactiveFormsModule],
  templateUrl: './habit-form-drawer.html',
  styleUrl: './habit-form-drawer.scss',
})
export class HabitFormDrawer {
  private readonly fb = inject(FormBuilder);

  readonly editingHabit = input<HabitResponse | null>(null);
  readonly submitting = input(false);

  readonly save = output<HabitRequest>();
  readonly cancelled = output<void>();

  readonly isEditMode = computed(() => this.editingHabit() !== null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    weeklyTarget: [7, [Validators.required, Validators.min(1), Validators.max(7)]],
  });

  constructor() {
    effect(() => {
      const habit = this.editingHabit();
      if (habit) {
        this.form.patchValue({
          name: habit.name,
          description: habit.description ?? '',
          weeklyTarget: habit.weeklyTarget,
        });
      } else {
        this.form.patchValue({ weeklyTarget: 7 });
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
      description: raw.description.trim() ? raw.description.trim() : null,
      weeklyTarget: raw.weeklyTarget,
    });
  }
}
