import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LEADERBOARD_REFRESH_MS, LeaderboardService } from '../../services/leaderboard.service';
import { AnalyticsService } from '../../services/analytics.service';
import { AppStoreService } from '../../services/app-store.service';
import { getTeam } from '../../data/teams';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function formatRefresh(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);
  private readonly leaderboard = inject(LeaderboardService);
  private readonly store = inject(AppStoreService);

  readonly entries = this.leaderboard.entries;
  readonly myRank = this.leaderboard.myRank;
  readonly lastRefresh = this.leaderboard.lastRefresh;
  readonly refreshMinutes = LEADERBOARD_REFRESH_MS / 60_000;

  readonly homeRoute = computed(() => (this.store.state().fanCard.teamId ? '/identity' : '/'));

  readonly subtitle = computed(
    () =>
      `Cumulative score · Updated ${formatRefresh(this.lastRefresh())} · auto-refreshes every ${this.refreshMinutes} min`
  );

  readonly rows = computed(() => {
    return this.entries().map((entry) => ({
      ...entry,
      teamFlag: getTeam(entry.teamId)?.flag ?? '🏳️',
      scoreLabel: `${entry.pts} pts`,
      durationLabel: `${entry.durationMins} min`,
    }));
  });

  ngOnInit(): void {
    this.store.markLeaderboardVisited();
    this.analytics.track('leaderboard_viewed', {
      count: this.entries().length,
      myRank: this.myRank(),
    });
  }

  onBack(): void {
    this.analytics.track('leaderboard_back_tapped');
    void this.router.navigateByUrl('/');
  }

  onRefresh(): void {
    this.analytics.track('leaderboard_refresh_tapped');
    this.leaderboard.refresh();
  }

  onReturnHome(): void {
    this.analytics.track('leaderboard_home_tapped');
    void this.router.navigateByUrl(this.homeRoute());
  }

  isTopFive(): boolean {
    const rank = this.myRank();
    return rank !== null && rank <= 5;
  }

}
