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
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [authGuard],
  },
  {
    path: 'board',
    loadComponent: () =>
      import('./features/tasks/task-board-page/task-board-page').then((m) => m.TaskBoardPage),
    canActivate: [authGuard],
  },
  {
    path: 'budget',
    loadComponent: () => import('./features/budget/budget-page/budget-page').then((m) => m.BudgetPage),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'dashboard' },
];
