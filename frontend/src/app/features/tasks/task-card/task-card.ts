import { Component, computed, input, output } from '@angular/core';
import { TaskResponse } from '../../../shared/models/task.model';
import { getDueInfo } from '../../../shared/utils/task-date.util';

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

  readonly dueInfo = computed(() => getDueInfo(this.task()));
}
