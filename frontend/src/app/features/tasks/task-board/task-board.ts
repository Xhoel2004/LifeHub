import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { TaskRequest, TaskResponse, TaskStatus } from '../../../shared/models/task.model';
import { TaskCard } from '../task-card/task-card';
import { TaskFormDrawer } from '../task-form-drawer/task-form-drawer';
import { TaskService } from '../task.service';

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

  readonly loading = signal(true);
  readonly columns = signal<Column[]>([
    { status: 'TODO', label: 'To do', tasks: [] },
    { status: 'IN_PROGRESS', label: 'In progress', tasks: [] },
    { status: 'DONE', label: 'Done', tasks: [] },
  ]);

  readonly drawerState = signal<{ task: TaskResponse | null } | null>(null);
  readonly savingTask = signal(false);
  readonly pendingDelete = signal<TaskResponse | null>(null);

  ngOnInit(): void {
    this.loadTasks();
  }

  get totalTasks(): number {
    return this.columns().reduce((sum, col) => sum + col.tasks.length, 0);
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
      if (event.previousIndex !== event.currentIndex) {
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        this.columns.update((cols) => [...cols]);
      }
      return;
    }

    const task = event.previousContainer.data[event.previousIndex];
    const newStatus = event.container.id as TaskStatus;

    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    this.columns.update((cols) => [...cols]);

    this.taskService.update(task.id, toRequest({ ...task, status: newStatus })).subscribe({
      next: (updated) => {
        const idx = event.container.data.findIndex((t) => t.id === updated.id);
        if (idx !== -1) {
          event.container.data[idx] = updated;
          this.columns.update((cols) => [...cols]);
        }
      },
      error: () => {
        transferArrayItem(
          event.container.data,
          event.previousContainer.data,
          event.currentIndex,
          event.previousIndex,
        );
        this.columns.update((cols) => [...cols]);
      },
    });
  }

  private loadTasks(): void {
    this.loading.set(true);
    this.taskService.list().subscribe({
      next: (tasks) => {
        this.applyTasks(tasks);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private applyTasks(tasks: TaskResponse[]): void {
    const byStatus: Record<TaskStatus, TaskResponse[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
    for (const task of tasks) {
      byStatus[task.status].push(task);
    }
    this.columns.set(this.columns().map((col) => ({ ...col, tasks: byStatus[col.status] })));
  }
}
