import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { UserService } from '../../core/services/user.service';

interface NavItem {
  label: string;
  path: string;
  color: string;
}

interface RouteData {
  crumb?: string;
  title?: string;
}

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  readonly user = this.userService.currentUser;
  readonly userInitials = computed(() => {
    const name = this.user()?.displayName?.trim();
    if (!name) {
      return '?';
    }
    const parts = name.split(/\s+/);
    const initials = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
    return initials.toUpperCase();
  });

  readonly today = new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

  readonly mobileNavOpen = signal(false);

  readonly mainNav: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', color: 'var(--accent-1)' },
    { label: 'Tasks', path: '/board', color: 'var(--accent-2)' },
    { label: 'Habits', path: '/habits', color: 'var(--accent-3)' },
    { label: 'Journal', path: '/journal', color: 'var(--accent-1)' },
    { label: 'Budget', path: '/budget', color: 'var(--accent-2)' },
  ];

  readonly secondaryNav: NavItem[] = [{ label: 'Profile', path: '/profile', color: 'var(--text-tertiary)' }];

  private readonly routeData = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.readRouteData()),
      startWith(this.readRouteData()),
    ),
    { initialValue: {} as RouteData },
  );

  readonly pageTitle = computed(() => this.routeData().title ?? '');
  readonly pageCrumb = computed(() => this.routeData().crumb ?? '');

  constructor() {
    this.userService.fetchCurrentUser().subscribe({ error: () => {} });
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  toggleMobileNav(): void {
    this.mobileNavOpen.update((open) => !open);
  }

  logout(): void {
    this.authService.logout();
  }

  private readRouteData(): RouteData {
    let route = this.activatedRoute.firstChild;
    while (route?.firstChild) {
      route = route.firstChild;
    }
    return route?.snapshot?.data ?? {};
  }
}
