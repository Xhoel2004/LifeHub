import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiErrorResponse } from '../../../shared/models/api-error.model';
import { AuthShell } from '../auth-shell/auth-shell';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, AuthShell],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string>>({});

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.fieldErrors.set({});

    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.router.navigateByUrl('/dashboard');
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        const apiError = error.error as ApiErrorResponse | undefined;
        if (apiError?.fieldErrors) {
          this.fieldErrors.set(apiError.fieldErrors);
        } else {
          this.errorMessage.set(apiError?.message ?? 'Registration failed. Please try again.');
        }
      },
    });
  }
}
