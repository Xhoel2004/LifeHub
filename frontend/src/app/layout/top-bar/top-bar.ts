import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { UserResponse } from '../../shared/models/user.model';

@Component({
  selector: 'app-top-bar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.scss',
})
export class TopBar {
  private readonly authService = inject(AuthService);

  readonly user = input<UserResponse | null>(null);

  logout(): void {
    this.authService.logout();
  }
}
