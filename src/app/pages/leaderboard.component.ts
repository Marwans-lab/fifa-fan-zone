import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { track } from '../../lib/analytics'
import { buildLeaderboard } from '../../lib/leaderboard-data'
import { StoreService } from '../../store/store.service'

@Component({
  selector: 'ffz-leaderboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardComponent {
  private readonly router = inject(Router)
  private readonly store = inject(StoreService)

  private readonly refreshTick = signal(0)
  readonly lastRefresh = signal(new Date())
  readonly rows = computed(() => {
    this.refreshTick()
    return buildLeaderboard(this.store.state().points)
  })
  readonly entries = this.rows
  readonly myRank = computed(() => this.rows().find(row => row.isMe)?.rank ?? null)

  constructor() {
    this.store.markLeaderboardVisited()
  }

  onBack(): void {
    void this.router.navigateByUrl('/card')
  }

  onRefresh(): void {
    this.refreshTick.update(value => value + 1)
    this.lastRefresh.set(new Date())
    track('leaderboard_refresh_tapped')
  }

  onReturnHome(): void {
    track('leaderboard_home_tapped')
    void this.router.navigateByUrl('/card')
  }
}
