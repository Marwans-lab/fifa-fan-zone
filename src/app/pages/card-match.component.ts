import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { Router } from '@angular/router'
import { track } from '../../lib/analytics'
import { StoreService } from '../../store/store.service'

@Component({
  selector: 'ffz-card-match-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-match.component.html',
  styleUrl: './card-match.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardMatchComponent {
  private readonly router = inject(Router)
  private readonly store = inject(StoreService)

  onBack(): void {
    track('card_match_abandoned')
    void this.router.navigateByUrl('/card')
  }

  onFinish(): void {
    this.store.addPoints(5)
    this.store.recordQuizResult('the-architect', 5, 5)
    this.store.completeFlow('the-architect')
    track('card_match_completed', { score: 5, total: 5 })
    void this.router.navigateByUrl('/results', {
      state: { score: 5, total: 5, quizTitle: 'The Architect' },
    })
  }
}
