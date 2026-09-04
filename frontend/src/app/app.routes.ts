import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: '',
    loadComponent: () => import('./layout/app-shell/app-shell').then((m) => m.AppShell),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
        data: { title: 'Dashboard', crumb: 'Overview' },
      },
      {
        path: 'board',
        loadComponent: () =>
          import('./features/tasks/task-board-page/task-board-page').then((m) => m.TaskBoardPage),
        data: { title: 'Tasks', crumb: 'Board' },
      },
      {
        path: 'budget',
        loadComponent: () => import('./features/budget/budget-page/budget-page').then((m) => m.BudgetPage),
        data: { title: 'Budget', crumb: 'Money' },
      },
      {
        path: 'habits',
        loadComponent: () => import('./features/habits/habits-page/habits-page').then((m) => m.HabitsPage),
        data: { title: 'Habits', crumb: 'Streaks' },
      },
      {
        path: 'journal',
        loadComponent: () => import('./features/journal/journal-page/journal-page').then((m) => m.JournalPage),
        data: { title: 'Journal', crumb: 'Private' },
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile-page/profile-page').then((m) => m.ProfilePage),
        data: { title: 'Profile', crumb: 'Account' },
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
