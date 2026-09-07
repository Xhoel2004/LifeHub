export interface HabitRequest {
  name: string;
  description: string | null;
  weeklyTarget: number;
}

export interface HabitResponse {
  id: number;
  name: string;
  description: string | null;
  weeklyTarget: number;
  completedToday: boolean;
  currentStreak: number;
  doneThisWeek: number;
  weekLog: boolean[];
  createdAt: string;
  updatedAt: string;
}

export interface HeatmapDayResponse {
  date: string;
  completed: number;
  total: number;
}
