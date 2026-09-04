import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-auth-shell',
  imports: [RouterLink],
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.scss',
})
export class AuthShell {
  readonly mode = input.required<AuthMode>();
  readonly errorMessage = input<string | null>(null);

  readonly title = computed(() => (this.mode() === 'login' ? 'Welcome back' : 'Create your account'));
  readonly subtitle = computed(() =>
    this.mode() === 'login' ? 'Sign in to see your board.' : 'Start organizing your life.',
  );
}
