import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PreferencesService } from '../../../core/services/preferences.service';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { JournalEntryRequest, JournalEntryResponse, JournalMood } from '../../../shared/models/journal-entry.model';
import { JournalService } from '../journal.service';

const MOODS: { value: JournalMood; label: string; emoji: string }[] = [
  { value: 'GREAT', label: 'Great', emoji: '😄' },
  { value: 'GOOD', label: 'Good', emoji: '🙂' },
  { value: 'OKAY', label: 'Okay', emoji: '😐' },
  { value: 'LOW', label: 'Low', emoji: '😕' },
  { value: 'AWFUL', label: 'Awful', emoji: '😞' },
];

const MOOD_MAP = new Map(MOODS.map((m) => [m.value, m]));

function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-journal-page',
  imports: [ReactiveFormsModule, ConfirmDialog],
  templateUrl: './journal-page.html',
  styleUrl: './journal-page.scss',
})
export class JournalPage implements OnInit {
  private readonly journalService = inject(JournalService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly preferencesService = inject(PreferencesService);

  readonly preferences = this.preferencesService.preferences;

  readonly moods = MOODS;

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly entries = signal<JournalEntryResponse[]>([]);
  readonly search = signal('');

  readonly mode = signal<'list' | 'edit'>('list');
  readonly editingEntry = signal<JournalEntryResponse | null>(null);
  readonly saving = signal(false);
  readonly pendingDelete = signal<JournalEntryResponse | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(150)]],
    body: ['', Validators.required],
    mood: ['OKAY' as JournalMood, Validators.required],
    entryDate: [today(), Validators.required],
  });

  readonly filteredEntries = computed(() => {
    const term = this.search().trim().toLowerCase();
    const entries = this.entries();
    if (!term) {
      return entries;
    }
    return entries.filter(
      (e) => e.title.toLowerCase().includes(term) || e.body.toLowerCase().includes(term),
    );
  });

  /**
   * Plain method, not a computed(): the form control's value is not a signal, so a
   * computed() here would never see a tracked dependency change and would stay
   * stuck at its first result. Angular re-invokes this every change-detection run instead.
   */
  wordCount(): number {
    const trimmed = this.form.controls.body.value.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }

  ngOnInit(): void {
    this.load();
  }

  retry(): void {
    this.load();
  }

  setSearch(value: string): void {
    this.search.set(value);
  }

  moodOf(mood: JournalMood) {
    return MOOD_MAP.get(mood)!;
  }

  preview(body: string): string {
    const clean = body.replace(/\s+/g, ' ').trim();
    return clean.length > 140 ? `${clean.slice(0, 140)}…` : clean;
  }

  openNew(): void {
    this.editingEntry.set(null);
    this.form.reset({ title: '', body: '', mood: 'OKAY', entryDate: today() });
    this.mode.set('edit');
  }

  openEntry(entry: JournalEntryResponse): void {
    this.editingEntry.set(entry);
    this.form.reset({
      title: entry.title,
      body: entry.body,
      mood: entry.mood,
      entryDate: entry.entryDate,
    });
    this.mode.set('edit');
  }

  pickMood(mood: JournalMood): void {
    this.form.controls.mood.setValue(mood);
  }

  backToList(): void {
    this.mode.set('list');
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: JournalEntryRequest = {
      title: raw.title.trim(),
      body: raw.body.trim(),
      mood: raw.mood,
      entryDate: raw.entryDate,
    };

    const editing = this.editingEntry();
    this.saving.set(true);

    const request$ = editing ? this.journalService.update(editing.id, request) : this.journalService.create(request);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toastService.show(editing ? 'Entry updated.' : 'Entry saved.');
        this.mode.set('list');
        this.load();
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  confirmDelete(entry: JournalEntryResponse): void {
    if (this.preferences().skipDeleteConfirm) {
      this.deleteEntry(entry);
      return;
    }
    this.pendingDelete.set(entry);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  performDelete(): void {
    const entry = this.pendingDelete();
    if (!entry) {
      return;
    }
    this.deleteEntry(entry);
  }

  private deleteEntry(entry: JournalEntryResponse): void {
    this.journalService.delete(entry.id).subscribe({
      next: () => {
        this.pendingDelete.set(null);
        this.toastService.show('Entry deleted.');
        if (this.editingEntry()?.id === entry.id) {
          this.mode.set('list');
        }
        this.load();
      },
      error: () => {
        this.pendingDelete.set(null);
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.journalService.list().subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }
}
