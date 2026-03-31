import { CommonModule } from '@angular/common'
import { Component, computed, inject } from '@angular/core'
import { Router } from '@angular/router'
import { StoreService } from '../../store/store.service'
import { track } from '../../lib/analytics'

interface ResultsNavState {
  score?: number
  total?: number
  quizTitle?: string
}

@Component({
  selector: 'app-results-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css',
})
export class ResultsComponent {
  private readonly router = inject(Router)
  readonly store = inject(StoreService)
  private readonly navState = history.state as ResultsNavState

  readonly score = this.navState.score ?? 0
  readonly total = this.navState.total ?? 0
  readonly quizTitle = this.navState.quizTitle ?? 'Quiz complete'
  readonly hasResult = this.total > 0
  readonly percentage = this.total > 0 ? this.score / this.total : 0

  readonly statusLabel = computed(() => {
    if (!this.hasResult) return 'Your score'
    if (this.percentage === 1) return 'Perfect score'
    if (this.percentage >= 0.8) return 'Top fan'
    if (this.percentage >= 0.6) return 'Good try'
    if (this.percentage >= 0.4) return 'Keep learning'
    return 'Better luck next time'
  })

  readonly homeRoute = computed(() =>
    this.store.state().fanCard.teamId ? '/card' : '/',
  )

  onViewLeaderboard(): void {
    track('results_leaderboard_tapped')
    void this.router.navigateByUrl('/leaderboard')
  }

  onReturnHome(): void {
    track('results_home_tapped')
    void this.router.navigateByUrl(this.homeRoute())
  }
}
