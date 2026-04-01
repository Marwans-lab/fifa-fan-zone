import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ButtonComponent } from '../../components/button/button.component';
import { ScreenComponent } from '../../components/screen/screen.component';
import { AnalyticsService } from '../../services/analytics.service';
import { LEADERBOARD_REFRESH_MS, LeaderboardService } from '../../services/leaderboard.service';
import { StoreService } from '../../services/store.service';

@Component({
  standalone: true,
  imports: [CommonModule, ScreenComponent, ButtonComponent],
  templateUrl: './leaderboard.page.html',
  styleUrl: './leaderboard.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly store = inject(StoreService);
  private readonly analytics = inject(AnalyticsService);
  private readonly leaderboardService = inject(LeaderboardService);

  readonly entries = this.leaderboardService.entries;
  readonly myRank = this.leaderboardService.myRank;
  readonly lastRefresh = this.leaderboardService.lastRefresh;
  readonly refreshMinutes = LEADERBOARD_REFRESH_MS / 60_000;
  readonly homeRoute = computed(() => (this.store.state().fanCard.teamId ? '/card' : '/'));
  readonly trophyIcon = 'assets/icons/Trophy-white.svg';
  readonly backIcon = 'assets/icons/Chevron-left-white.svg';
  readonly refreshIcon = 'assets/icons/flip-white.svg';

  ngOnInit(): void {
    this.store.markLeaderboardVisited();
    this.leaderboardService.startAutoRefresh();
    this.analytics.track('leaderboard_viewed');
  }

  ngOnDestroy(): void {
    this.leaderboardService.stopAutoRefresh();
  }

  goBack(): void {
    window.history.back();
  }

  refresh(): void {
    this.analytics.track('leaderboard_refresh_tapped');
    this.leaderboardService.refresh();
  }

  returnHome(): void {
    this.analytics.track('leaderboard_home_tapped');
    void this.router.navigateByUrl(this.homeRoute());
  }

  formatRefresh(date: Date): string {
    const pad2 = (value: number): string => String(value).padStart(2, '0');
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
  }

  trackByRank(_index: number, entry: { rank: number }): number {
    return entry.rank;
  }

}
