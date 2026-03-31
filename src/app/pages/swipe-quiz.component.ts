import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { StoreService } from '../../store/store.service'
import { SWIPE_QUIZZES } from '../../data/swipeQuizzes'
import { track } from '../../lib/analytics'
import { type FlowId } from '../../store/store.service'

@Component({
  selector: 'ffz-swipe-quiz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './swipe-quiz.component.html',
  styleUrl: './swipe-quiz.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwipeQuizComponent {
  private readonly router = inject(Router)
  private readonly store = inject(StoreService)

  readonly quiz = computed(() => {
    const quizId = (history.state as { quizId?: string } | null)?.quizId
    return SWIPE_QUIZZES.find(entry => entry.id === quizId) ?? SWIPE_QUIZZES[0]
  })
  readonly title = computed(() => this.quiz()?.title ?? 'Swipe quiz')
  readonly total = computed(() => this.quiz().statements.length)
  readonly currentIdx = signal(0)
  readonly score = signal(0)
  readonly results = signal<(boolean | null)[]>(Array.from({ length: this.total() }, () => null))
  readonly currentStatement = computed(() => this.quiz().statements[this.currentIdx()])

  onBack(): void {
    track('swipe_quiz_abandoned', { quizId: this.quiz().id, idx: this.currentIdx() })
    void this.router.navigateByUrl('/card')
  }

  answer(isTrueSelection: boolean): void {
    const statement = this.currentStatement()
    if (!statement) {
      return
    }
    const correct = statement.isTrue === isTrueSelection
    if (correct) {
      this.score.update(prev => prev + 1)
    }

    const nextResults = [...this.results()]
    nextResults[this.currentIdx()] = correct
    this.results.set(nextResults)

    track('swipe_quiz_answer', {
      quizId: this.quiz().id,
      statementId: statement.id,
      correct,
    })

    if (this.currentIdx() >= this.total() - 1) {
      this.complete()
      return
    }

    this.currentIdx.update(prev => prev + 1)
  }

  private complete(): void {
    const finalScore = this.score()
    const quiz = this.quiz()
    this.store.recordQuizResult(quiz.id, finalScore, this.total())
    this.store.addPoints(finalScore)
    this.store.completeFlow(quiz.id as FlowId)
    track('swipe_quiz_completed', { quizId: quiz.id, score: finalScore, total: this.total() })
    void this.router.navigateByUrl('/results', {
      state: { score: finalScore, total: this.total(), quizTitle: this.title() },
    })
  }
}
