import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskRequest, TaskResponse } from '../../../shared/models/task.model';

@Component({
  selector: 'app-task-form-drawer',
  imports: [ReactiveFormsModule],
  templateUrl: './task-form-drawer.html',
  styleUrl: './task-form-drawer.scss',
})
export class TaskFormDrawer {
  private readonly fb = inject(FormBuilder);

  readonly editingTask = input<TaskResponse | null>(null);
  readonly submitting = input(false);

  readonly save = output<TaskRequest>();
  readonly cancelled = output<void>();

  readonly isEditMode = computed(() => this.editingTask() !== null);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    status: ['TODO' as TaskResponse['status'], Validators.required],
    priority: ['MEDIUM' as TaskResponse['priority'], Validators.required],
    dueDate: [''],
  });

  constructor() {
    effect(() => {
      const task = this.editingTask();
      if (task) {
        this.form.patchValue({
          title: task.title,
          description: task.description ?? '',
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate ?? '',
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
      title: raw.title.trim(),
      description: raw.description.trim() ? raw.description.trim() : null,
      status: raw.status,
      priority: raw.priority,
      dueDate: raw.dueDate ? raw.dueDate : null,
    });
  }
}
