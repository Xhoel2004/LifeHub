import { TaskResponse } from '../models/task.model';

export interface DueInfo {
  text: string;
  overdue: boolean;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Whole days between today and the task's due date (negative if the due date is past). */
export function daysUntilDue(dueDate: string): number {
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(`${dueDate}T00:00:00`));
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

/** A task counts as overdue only if it has a due date, isn't DONE, and that date has passed. */
export function isOverdue(task: Pick<TaskResponse, 'dueDate' | 'status'>): boolean {
  if (!task.dueDate || task.status === 'DONE') {
    return false;
  }
  return daysUntilDue(task.dueDate) < 0;
}

/** Shared human-readable due-date label, used by both the board cards and the dashboard. */
export function getDueInfo(task: Pick<TaskResponse, 'dueDate' | 'status'>): DueInfo | null {
  const dueDate = task.dueDate;
  if (!dueDate) {
    return null;
  }

  const diffDays = daysUntilDue(dueDate);

  if (diffDays < 0 && task.status !== 'DONE') {
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

  const due = startOfDay(new Date(`${dueDate}T00:00:00`));
  return { text: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), overdue: false };
}
