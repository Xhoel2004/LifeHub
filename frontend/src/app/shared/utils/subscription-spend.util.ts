import { BillingCycle, SubscriptionResponse } from '../models/subscription.model';

const WEEKS_PER_YEAR = 52;

/** Normalizes any billing cycle to a monthly cost, using a 52-week year for WEEKLY (not amount * 4). */
export function monthlyEquivalent(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'WEEKLY':
      return (amount * WEEKS_PER_YEAR) / 12;
    case 'MONTHLY':
      return amount;
    case 'YEARLY':
      return amount / 12;
  }
}

/** Normalizes any billing cycle to a yearly cost, consistent with {@link monthlyEquivalent}. */
export function yearlyEquivalent(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'WEEKLY':
      return amount * WEEKS_PER_YEAR;
    case 'MONTHLY':
      return amount * 12;
    case 'YEARLY':
      return amount;
  }
}

export interface RenewalInfo {
  text: string;
  daysRemaining: number;
  overdue: boolean;
  dueSoon: boolean;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Whole days between today and the given date (negative if the date is past). */
export function daysUntil(dateStr: string): number {
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(`${dateStr}T00:00:00`));
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

/** Human-readable renewal label; a subscription only reads as overdue while it's still active. */
export function getRenewalInfo(sub: Pick<SubscriptionResponse, 'nextDueDate' | 'status'>): RenewalInfo {
  const diffDays = daysUntil(sub.nextDueDate);
  const overdue = diffDays < 0 && sub.status === 'ACTIVE';

  let text: string;
  if (diffDays < 0) {
    text = `Overdue by ${Math.abs(diffDays)}d`;
  } else if (diffDays === 0) {
    text = 'Due today';
  } else if (diffDays === 1) {
    text = 'Due tomorrow';
  } else {
    text = `Due in ${diffDays}d`;
  }

  return { text, daysRemaining: diffDays, overdue, dueSoon: diffDays >= 0 && diffDays <= 7 };
}
