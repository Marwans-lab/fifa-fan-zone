import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { StoreService } from '../services/store.service';

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
export class LeaderboardPage implements OnInit {
  private readonly store = inject(StoreService);

  ngOnInit(): void {
    this.store.markLeaderboardVisited();
  }
}
