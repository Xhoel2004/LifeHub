import { Component, computed, input, output } from '@angular/core';
import { TaskResponse } from '../../../shared/models/task.model';

@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
})
export class TaskCard {
  readonly task = input.required<TaskResponse>();

  readonly edit = output<void>();
  readonly deleteRequested = output<void>();

  readonly priorityLabel = computed(() => {
    switch (this.task().priority) {
      case 'HIGH':
        return 'High';
      case 'MEDIUM':
        return 'Medium';
      default:
        return 'Low';
    }
  });

  readonly dueInfo = computed(() => {
    const dueDate = this.task().dueDate;
    if (!dueDate) {
      return null;
    }

    const today = startOfDay(new Date());
    const due = startOfDay(new Date(`${dueDate}T00:00:00`));
    const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

    if (diffDays < 0 && this.task().status !== 'DONE') {
      return { text: `Overdue by ${Math.abs(diffDays)}d`, overdue: true };
    }
    if (diffDays === 0) {
      return { text: 'Due today', overdue: false };
    }
    if (diffDays === 1) {
      return { text: 'Due tomorrow', overdue: false };
    }
    if (diffDays <= 7) {
      return { text: `Due in ${diffDays}d`, overdue: false };
    }
    return { text: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), overdue: false };
  });
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
