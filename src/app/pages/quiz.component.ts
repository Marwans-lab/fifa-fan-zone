import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core'
import { Router } from '@angular/router'
import { QUIZZES, type QuizQuestion } from '../../data/quizzes'
import { track } from '../../lib/analytics'
import { FLOW_IDS, type FlowId, StoreService } from '../../store/store.service'

const QUESTION_TIME = 15

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router)
  private readonly store = inject(StoreService)
  private timerId: ReturnType<typeof setInterval> | null = null

  readonly qIndex = signal(0)
  readonly score = signal(0)
  readonly selectedOptionId = signal<string | null>(null)
  readonly revealed = signal(false)
  readonly timeLeft = signal(QUESTION_TIME)
  readonly optionLetters = ['A', 'B', 'C', 'D']

  readonly quiz = computed(() => {
    const requestedId =
      typeof (history.state as { quizId?: unknown } | null)?.quizId === 'string'
        ? ((history.state as { quizId: string }).quizId ?? null)
        : null
    return QUIZZES.find(q => q.id === requestedId) ?? QUIZZES[0]
  })

  readonly question = computed(() => this.quiz().questions[this.qIndex()])
  readonly currentQuestion = this.question
  readonly total = computed(() => this.quiz().questions.length)
  readonly isLastQuestion = computed(() => this.qIndex() >= this.total() - 1)
  readonly progressPercent = computed(() =>
    ((this.qIndex() + (this.revealed() ? 1 : 0)) / this.total()) * 100,
  )
  readonly feedbackText = computed(() => {
    if (!this.revealed()) {
      return ''
    }
    if (this.selectedOptionId() === this.currentQuestion().correctId) {
      return 'Correct!'
    }
    if (!this.selectedOptionId()) {
      return "Time's up!"
    }
    return 'Not quite'
  })

  questionOrNull(): QuizQuestion | null {
    return this.question() ?? null
  }

  ngOnInit(): void {
    this.startTimer()
  }

  ngOnDestroy(): void {
    this.stopTimer()
  }

  onBack(): void {
    track('quiz_abandoned', { quizId: this.quiz().id, qIdx: this.qIndex() })
    void this.router.navigateByUrl('/card')
  }

  onSelect(optionId: string): void {
    if (this.revealed()) {
      return
    }
    this.selectedOptionId.set(optionId)
    this.revealed.set(true)
    this.stopTimer()
    const correct = optionId === this.question().correctId
    if (correct) {
      this.score.update(prev => prev + 1)
    }
    track('quiz_answer', { quizId: this.quiz().id, qIdx: this.qIndex(), correct })
  }

  onNext(): void {
    if (!this.revealed()) {
      return
    }
    if (this.isLastQuestion()) {
      const finalScore = this.score()
      const quiz = this.quiz()
      this.store.addPoints(finalScore)
      this.store.recordQuizResult(quiz.id, finalScore, this.total())
      if ((FLOW_IDS as readonly string[]).includes(quiz.id)) {
        this.store.completeFlow(quiz.id as FlowId)
      }
      track('quiz_completed', { quizId: quiz.id, score: finalScore, total: this.total() })
      void this.router.navigateByUrl('/results', {
        state: { score: finalScore, total: this.total(), quizTitle: quiz.title },
      })
      return
    }

    this.qIndex.update(prev => prev + 1)
    this.selectedOptionId.set(null)
    this.revealed.set(false)
    this.timeLeft.set(QUESTION_TIME)
    this.startTimer()
  }

  private startTimer(): void {
    this.stopTimer()
    this.timerId = setInterval(() => {
      if (this.revealed()) {
        return
      }
      const next = this.timeLeft() - 1
      if (next <= 0) {
        this.timeLeft.set(0)
        this.revealed.set(true)
        this.stopTimer()
        track('quiz_question_timeout', { quizId: this.quiz().id, qIdx: this.qIndex() })
        return
      }
      this.timeLeft.set(next)
    }, 1000)
  }

  private stopTimer(): void {
    if (!this.timerId) {
      return
    }
    clearInterval(this.timerId)
    this.timerId = null
  }
}
