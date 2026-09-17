import { Injectable, effect, signal } from '@angular/core';

export interface Preferences {
  reduceMotion: boolean;
  hideTaskDescriptions: boolean;
  showHabitHeatmap: boolean;
  skipDeleteConfirm: boolean;
}

const STORAGE_KEY = 'lifehub.preferences';

const DEFAULTS: Preferences = {
  reduceMotion: false,
  hideTaskDescriptions: false,
  showHabitHeatmap: true,
  skipDeleteConfirm: false,
};

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULTS };
    }
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function savePreferences(preferences: Preferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    /* localStorage unavailable (private browsing, etc.) -- preference just won't persist */
  }
}

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly preferencesSignal = signal<Preferences>(loadPreferences());
  readonly preferences = this.preferencesSignal.asReadonly();

  constructor() {
    effect(() => {
      document.documentElement.classList.toggle('reduce-motion', this.preferencesSignal().reduceMotion);
    });
  }

  toggle(key: keyof Preferences): void {
    const next = { ...this.preferencesSignal(), [key]: !this.preferencesSignal()[key] };
    this.preferencesSignal.set(next);
    savePreferences(next);
  }
}
