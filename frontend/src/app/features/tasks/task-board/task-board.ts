import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { PreferencesService } from '../../../core/services/preferences.service';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { TaskPriority, TaskRequest, TaskResponse, TaskStatus } from '../../../shared/models/task.model';
import { daysUntilDue, isOverdue } from '../../../shared/utils/task-date.util';
import { TaskCard } from '../task-card/task-card';
import { TaskFormDrawer } from '../task-form-drawer/task-form-drawer';
import { TaskService } from '../task.service';

type PriorityFilter = 'all' | TaskPriority;
type DueFilter = 'all' | 'overdue' | 'week' | 'none';

interface Column {
  status: TaskStatus;
  label: string;
  tasks: TaskResponse[];
}

function toRequest(task: TaskResponse): TaskRequest {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
  };
}

@Component({
  selector: 'app-task-board',
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, TaskCard, TaskFormDrawer, ConfirmDialog],
  templateUrl: './task-board.html',
  styleUrl: './task-board.scss',
})
export class TaskBoard implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly toastService = inject(ToastService);
  private readonly preferencesService = inject(PreferencesService);

  readonly preferences = this.preferencesService.preferences;

  readonly loading = signal(true);
  readonly allTasks = signal<TaskResponse[]>([]);

  readonly search = signal('');
  readonly priorityFilter = signal<PriorityFilter>('all');
  readonly dueFilter = signal<DueFilter>('all');

  readonly drawerState = signal<{ task: TaskResponse | null } | null>(null);
  readonly savingTask = signal(false);
  readonly pendingDelete = signal<TaskResponse | null>(null);

  readonly filteredTasks = computed(() => {
    const search = this.search().trim().toLowerCase();
    const priority = this.priorityFilter();
    const due = this.dueFilter();

    return this.allTasks().filter((task) => {
      if (search && !task.title.toLowerCase().includes(search)) {
        return false;
      }
      if (priority !== 'all' && task.priority !== priority) {
        return false;
      }
      if (due === 'overdue' && !isOverdue(task)) {
        return false;
      }
      if (due === 'week' && !(task.dueDate && !isOverdue(task) && daysUntilDue(task.dueDate) <= 7)) {
        return false;
      }
      if (due === 'none' && task.dueDate) {
        return false;
      }
      return true;
    });
  });

  readonly columns = computed<Column[]>(() => {
    const byStatus: Record<TaskStatus, TaskResponse[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
    for (const task of this.filteredTasks()) {
      byStatus[task.status].push(task);
    }
    return [
      { status: 'TODO', label: 'To do', tasks: byStatus.TODO },
      { status: 'IN_PROGRESS', label: 'In progress', tasks: byStatus.IN_PROGRESS },
      { status: 'DONE', label: 'Done', tasks: byStatus.DONE },
    ];
  });

  readonly totalTasks = computed(() => this.allTasks().length);
  readonly filtersActive = computed(
    () => this.search().trim() !== '' || this.priorityFilter() !== 'all' || this.dueFilter() !== 'all',
  );

  ngOnInit(): void {
    this.loadTasks();
  }

  setSearch(value: string): void {
    this.search.set(value);
  }

  setPriorityFilter(value: PriorityFilter): void {
    this.priorityFilter.set(value);
  }

  setDueFilter(value: DueFilter): void {
    this.dueFilter.set(value);
  }

  clearFilters(): void {
    this.search.set('');
    this.priorityFilter.set('all');
    this.dueFilter.set('all');
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

  confirmDelete(task: TaskResponse): void {
    if (this.preferences().skipDeleteConfirm) {
      this.deleteTask(task);
      return;
    }
    this.pendingDelete.set(task);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  performDelete(): void {
    const task = this.pendingDelete();
    if (!task) {
      return;
    }
    this.deleteTask(task);
  }

  private deleteTask(task: TaskResponse): void {
    this.taskService.delete(task.id).subscribe({
      next: () => {
        this.pendingDelete.set(null);
        this.toastService.show('Task deleted.');
        this.loadTasks();
      },
      error: () => {
        this.pendingDelete.set(null);
      },
    });
  }

  onDrop(event: CdkDragDrop<TaskResponse[]>): void {
    if (event.previousContainer === event.container) {
      return;
    }

    const task = event.previousContainer.data[event.previousIndex];
    const newStatus = event.container.id as TaskStatus;

    this.taskService.update(task.id, toRequest({ ...task, status: newStatus })).subscribe({
      next: (updated) => {
        this.allTasks.update((tasks) => tasks.map((t) => (t.id === updated.id ? updated : t)));
      },
      error: () => {
        this.toastService.show('Could not move task. Please try again.');
      },
    });
  }

  private loadTasks(): void {
    this.loading.set(true);
    this.taskService.list().subscribe({
      next: (tasks) => {
        this.allTasks.set(tasks);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
