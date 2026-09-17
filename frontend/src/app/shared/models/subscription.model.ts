export type SubscriptionCategory =
  | 'ENTERTAINMENT'
  | 'MUSIC'
  | 'STREAMING'
  | 'SOFTWARE'
  | 'FITNESS'
  | 'HOUSING'
  | 'UTILITIES'
  | 'PHONE_INTERNET'
  | 'INSURANCE'
  | 'TRANSPORTATION'
  | 'EDUCATION'
  | 'GAMING'
  | 'SHOPPING'
  | 'OTHER';

export type BillingCycle = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'CASH' | 'PAYPAL' | 'OTHER';

export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export interface SubscriptionRequest {
  name: string;
  category: SubscriptionCategory;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  nextDueDate: string;
  paymentMethod: PaymentMethod;
  notes: string | null;
}

export interface SubscriptionResponse {
  id: number;
  name: string;
  category: SubscriptionCategory;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  nextDueDate: string;
  paymentMethod: PaymentMethod;
  status: SubscriptionStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const SUBSCRIPTION_CATEGORY_LABELS: Record<SubscriptionCategory, string> = {
  ENTERTAINMENT: 'Entertainment',
  MUSIC: 'Music',
  STREAMING: 'Streaming',
  SOFTWARE: 'Software',
  FITNESS: 'Fitness',
  HOUSING: 'Housing',
  UTILITIES: 'Utilities',
  PHONE_INTERNET: 'Phone & Internet',
  INSURANCE: 'Insurance',
  TRANSPORTATION: 'Transportation',
  EDUCATION: 'Education',
  GAMING: 'Gaming',
  SHOPPING: 'Shopping',
  OTHER: 'Other',
};

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  BANK_TRANSFER: 'Bank Transfer',
  CASH: 'Cash',
  PAYPAL: 'PayPal',
  OTHER: 'Other',
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
};
