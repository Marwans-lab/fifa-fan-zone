import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { StoreService, type FlowId } from '../../store/store.service'
import { RANKING_QUIZZES } from '../../data/rankingQuizzes'
import { track } from '../../lib/analytics'

@Component({
  selector: 'app-ranking-quiz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ranking-quiz.component.html',
  styleUrl: './ranking-quiz.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankingQuizComponent {
  private readonly router = inject(Router)
  private readonly store = inject(StoreService)
  readonly quiz = RANKING_QUIZZES[0]
  readonly question = this.quiz.questions[0]

  readonly ordering = signal(this.shuffle(this.question.items.map(item => item.id)))
  readonly submitted = signal(false)
  readonly score = signal(0)

  readonly orderedItems = computed(() =>
    this.ordering()
      .map(id => this.question.items.find(item => item.id === id))
      .filter((item): item is (typeof this.question.items)[number] => !!item),
  )

  moveUp(index: number): void {
    if (index <= 0 || this.submitted()) {
      return
    }
    const next = [...this.ordering()]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    this.ordering.set(next)
  }

  moveDown(index: number): void {
    if (index >= this.ordering().length - 1 || this.submitted()) {
      return
    }
    const next = [...this.ordering()]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    this.ordering.set(next)
  }

  submit(): void {
    if (this.submitted()) {
      return
    }
    const expected = this.question.items.map(item => item.id).join('|')
    const actual = this.ordering().join('|')
    const score = expected === actual ? 1 : 0
    this.submitted.set(true)
    this.score.set(score)
    this.store.addPoints(score)
    this.store.recordQuizResult(this.quiz.id, score, 1)
    this.store.completeFlow(this.quiz.id as FlowId)
    track('ranking_quiz_completed', { score, total: 1, quizId: this.quiz.id })
    void this.router.navigate(['/results'], {
      state: { score, total: 1, quizTitle: this.quiz.title },
    })
  }

  onBack(): void {
    track('ranking_quiz_abandoned', { quizId: this.quiz.id })
    void this.router.navigateByUrl('/card')
  }

  private shuffle<T>(values: T[]): T[] {
    const output = [...values]
    for (let i = output.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[output[i], output[j]] = [output[j], output[i]]
    }
    return output
  }
}
