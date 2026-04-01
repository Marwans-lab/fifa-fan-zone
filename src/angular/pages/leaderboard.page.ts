import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <main class="angular-page">
      <h1 class="angular-page__title">Leaderboard</h1>
      <p class="angular-page__description">
        Angular migration placeholder for the leaderboard route.
      </p>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardPage {}
