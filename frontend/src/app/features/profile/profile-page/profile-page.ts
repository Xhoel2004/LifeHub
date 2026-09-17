import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { Preferences, PreferencesService } from '../../../core/services/preferences.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

interface PreferenceRow {
  key: keyof Preferences;
  label: string;
  hint: string;
}

const PREFERENCE_ROWS: PreferenceRow[] = [
  { key: 'reduceMotion', label: 'Reduce motion', hint: 'Turns off page animations and transitions.' },
  { key: 'hideTaskDescriptions', label: 'Hide task descriptions', hint: 'Show only titles on the task board cards.' },
  { key: 'showHabitHeatmap', label: 'Show habit heatmap', hint: 'Display the 12-week activity heatmap on the Habits page.' },
  { key: 'skipDeleteConfirm', label: 'Skip delete confirmations', hint: 'Delete tasks, habits, budget entries and journal entries immediately, without asking first.' },
];

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly preferencesService = inject(PreferencesService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly user = this.userService.currentUser;
  readonly preferences = this.preferencesService.preferences;
  readonly preferenceRows = PREFERENCE_ROWS;
  readonly saving = signal(false);

  readonly userInitials = computed(() => {
    const name = this.user()?.displayName ?? '';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  });

  readonly form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    effect(() => {
      const user = this.user();
      if (user) {
        this.form.patchValue({ displayName: user.displayName, email: user.email });
      }
    });
  }

  togglePreference(key: keyof Preferences): void {
    this.preferencesService.toggle(key);
  }

  saveProfile(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.saving.set(true);

    this.userService.updateProfile({ displayName: raw.displayName.trim(), email: raw.email.trim() }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toastService.show('Profile updated.');
      },
      error: (err) => {
        this.saving.set(false);
        if (err?.status === 409) {
          this.toastService.show('That email is already in use.');
        }
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
