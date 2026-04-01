import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { RANKING_QUIZZES, type RankingItem, type RankingQuiz } from '../../data/rankingQuizzes';
import { FLOW_IDS, type FlowId } from '../models/flow-id.model';
import { AnalyticsService } from '../services/analytics.service';
import { StoreService } from '../services/store.service';

const QUESTION_TIME = 15;
const ITEM_HEIGHT = 70;

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <main
      data-page="ranking-quiz"
      style="
        min-height: 100dvh;
        display: flex;
        justify-content: center;
        background: var(--c-bg);
        color: var(--c-text-1);
      "
    >
      <section
        style="
          width: 100%;
          max-width: 420px;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          padding: var(--sp-4);
          gap: var(--sp-4);
        "
      >
        <header style="display: flex; align-items: center; gap: var(--sp-3)">
          <button
            type="button"
            data-ui="back-btn"
            aria-label="Go back"
            (click)="handleBack()"
            style="
              width: var(--sp-12);
              min-height: var(--sp-12);
              border-radius: var(--r-full);
              border: var(--f-brand-border-size-default) solid var(--c-border);
              background: var(--c-surface);
              color: var(--c-text-1);
              font: var(--f-brand-type-headline);
              cursor: pointer;
            "
          >
            &lt;
          </button>
          <div
            style="
              flex: 1;
              height: var(--sp-2);
              border-radius: var(--r-full);
              overflow: hidden;
              background: var(--c-surface-raise);
            "
          >
            <div
              [style.width.%]="progressPercent()"
              style="
                height: 100%;
                border-radius: var(--r-full);
                background: var(--c-accent);
                transition: width var(--f-brand-motion-duration-instant)
                  var(--f-brand-motion-easing-default);
              "
            ></div>
          </div>
          <span style="font: var(--f-brand-type-caption); color: var(--c-text-2)">
            {{ questionIndex() + 1 }}/{{ totalQuestions() }}
          </span>
        </header>

        <div style="display: flex; justify-content: center">
          <div style="position: relative; width: 64px; height: 64px">
            <svg width="64" height="64" viewBox="0 0 64 64" style="transform: rotate(-90deg)" aria-hidden="true">
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--c-surface-raise)" stroke-width="4"></circle>
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                [attr.stroke]="timeLeft() <= 5 ? 'var(--c-error)' : 'var(--c-accent)'"
                stroke-width="4"
                [attr.stroke-dasharray]="timerCircumference"
                [attr.stroke-dashoffset]="timerOffset()"
                stroke-linecap="round"
                style="transition: stroke-dashoffset 1s linear"
              ></circle>
            </svg>
            <span
              style="
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font: var(--f-brand-type-headline-medium);
              "
            >
              {{ timeLeft() }}
            </span>
          </div>
        </div>

        <h1
          style="
            margin: 0;
            text-align: center;
            font: var(--f-brand-type-title-4);
            color: var(--c-text-1);
          "
        >
          {{ currentQuestion().question }}
        </h1>

        <div style="display: flex; flex-direction: column; gap: var(--sp-3)">
          @for (item of items(); track item.id; let idx = $index) {
            <div
              (pointerdown)="startDrag(idx, $event)"
              [ngStyle]="rankItemStyle(idx, item)"
              data-section="rank-item"
              style="
                min-height: var(--sp-14);
                border-radius: var(--r-full);
                border: var(--f-brand-border-size-default) solid var(--c-border);
                background: var(--c-surface);
                display: flex;
                align-items: center;
                gap: var(--sp-3);
                padding: 0 var(--sp-4);
                user-select: none;
                touch-action: none;
              "
            >
              <span
                [ngStyle]="rankBadgeStyle(idx, item)"
                style="
                  width: var(--sp-7);
                  min-width: var(--sp-7);
                  min-height: var(--sp-7);
                  border-radius: var(--r-full);
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  font: var(--f-brand-type-caption-medium);
                "
              >
                {{ badgeLabel(idx, item) }}
              </span>
              <span style="flex: 1; font: var(--f-brand-type-body-medium); color: var(--c-text-1)">
                {{ item.label }}
              </span>
              @if (revealed() && !isCorrectPosition(item, idx)) {
                <span style="font: var(--f-brand-type-caption); color: var(--c-text-2)">
                  #{{ correctIndex(item) + 1 }}
                </span>
              } @else if (!revealed()) {
                <span style="font: var(--f-brand-type-caption); color: var(--c-text-2)">::</span>
              }
            </div>
          }
        </div>

        <div style="margin-top: auto">
          @if (revealed()) {
            <p
              style="
                margin: 0 0 var(--sp-3);
                text-align: center;
                font: var(--f-brand-type-caption-medium);
              "
              [style.color]="feedbackColor()"
            >
              {{ feedbackText() }}
            </p>
          }
          <button
            type="button"
            data-ui="submit-btn"
            (click)="revealed() ? handleNext() : handleSubmit()"
            style="
              width: 100%;
              min-height: var(--sp-14);
              border-radius: var(--f-brand-radius-rounded);
              border: none;
              background: var(--f-brand-color-background-primary);
              color: var(--f-brand-color-text-light);
              font: var(--f-brand-type-body-medium);
              cursor: pointer;
            "
          >
            {{ buttonLabel() }}
          </button>
        </div>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankingQuizPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(StoreService);
  private readonly analytics = inject(AnalyticsService);

  readonly quiz = signal<RankingQuiz>(RANKING_QUIZZES[0]);
  readonly questionIndex = signal(0);
  readonly score = signal(0);
  readonly revealed = signal(false);
  readonly timeLeft = signal(QUESTION_TIME);
  readonly items = signal<RankingItem[]>([]);
  readonly dragIndex = signal<number | null>(null);
  readonly dragOffset = signal(0);

  readonly totalQuestions = computed(() => this.quiz().questions.length);
  readonly currentQuestion = computed(() => this.quiz().questions[this.questionIndex()]);
  readonly progressPercent = computed(() => {
    const completed = this.questionIndex() + (this.revealed() ? 1 : 0);
    return (completed / this.totalQuestions()) * 100;
  });
  readonly questionScore = computed(() => this.scoreForItems(this.items()));
  readonly timerCircumference = 2 * Math.PI * 28;
  readonly timerOffset = computed(() => {
    const progress = 1 - this.timeLeft() / QUESTION_TIME;
    return this.timerCircumference * progress;
  });

  private dragStartY = 0;
  private dragBaseIndex = 0;
  private timerId: number | null = null;

  ngOnInit(): void {
    const routeQuizId = this.route.snapshot.paramMap.get('quizId');
    const stateQuizId = this.readStateString('quizId');
    const quizId = routeQuizId ?? stateQuizId;
    const quiz = RANKING_QUIZZES.find(entry => entry.id === quizId) ?? RANKING_QUIZZES[0];
    this.quiz.set(quiz);
    this.prepareQuestion();
    this.analytics.track('ranking_quiz_viewed', { quizId: quiz.id });
    window.addEventListener('pointermove', this.onPointerMove, { passive: false });
    window.addEventListener('pointerup', this.onPointerUp);
  }

  ngOnDestroy(): void {
    this.stopTimer();
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  }

  startDrag(index: number, event: PointerEvent): void {
    if (this.revealed()) return;
    this.dragIndex.set(index);
    this.dragOffset.set(0);
    this.dragStartY = event.clientY;
    this.dragBaseIndex = index;
  }

  handleSubmit(): void {
    if (this.revealed()) return;
    this.stopTimer();
    this.revealed.set(true);
    const gained = this.scoreForItems(this.items());
    this.score.update(value => value + gained);
    this.analytics.track('quiz_answer', {
      quizId: this.quiz().id,
      qIdx: this.questionIndex(),
      correctPositions: gained,
    });
  }

  handleNext(): void {
    const isLast = this.questionIndex() >= this.totalQuestions() - 1;
    if (isLast) {
      this.finishQuiz();
      return;
    }
    this.questionIndex.update(value => value + 1);
    this.prepareQuestion();
  }

  handleBack(): void {
    this.analytics.track('quiz_abandoned', { quizId: this.quiz().id, qIdx: this.questionIndex() });
    window.history.back();
  }

  rankItemStyle(index: number, item: RankingItem): Record<string, string> {
    const dragging = this.dragIndex() === index;
    const correct = this.isCorrectPosition(item, index);
    if (dragging) {
      return {
        transform: `translateY(${this.dragOffset()}px) scale(1.03)`,
        borderColor: 'var(--c-accent)',
        background: 'var(--c-accent-bg)',
        zIndex: '10',
        position: 'relative',
      };
    }
    if (this.revealed() && correct) {
      return {
        borderColor: 'var(--c-correct-border)',
        background: 'var(--c-correct-bg)',
      };
    }
    if (this.revealed() && !correct) {
      return {
        borderColor: 'var(--c-error-border)',
        background: 'var(--c-error-bg)',
      };
    }
    return {
      transition: 'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
    };
  }

  rankBadgeStyle(index: number, item: RankingItem): Record<string, string> {
    const correct = this.isCorrectPosition(item, index);
    if (this.revealed() && correct) {
      return {
        background: 'var(--c-correct)',
        color: 'var(--f-brand-color-text-light)',
      };
    }
    if (this.revealed() && !correct) {
      return {
        background: 'var(--c-error)',
        color: 'var(--f-brand-color-text-light)',
      };
    }
    return {
      background: 'var(--c-surface-raise)',
      color: 'var(--c-text-2)',
    };
  }

  badgeLabel(index: number, item: RankingItem): string {
    if (!this.revealed()) {
      return String(index + 1);
    }
    return this.isCorrectPosition(item, index) ? 'OK' : 'NO';
  }

  buttonLabel(): string {
    if (!this.revealed()) return 'Lock in order';
    const isLast = this.questionIndex() >= this.totalQuestions() - 1;
    if (!isLast) return 'Next';
    return `Finish - ${this.score()}/${this.totalQuestions() * 4}`;
  }

  feedbackText(): string {
    const value = this.questionScore();
    if (value === 4) return 'Perfect order! +4 points';
    return `${value}/4 correct positions`;
  }

  feedbackColor(): string {
    const value = this.questionScore();
    if (value === 4) return 'var(--c-correct)';
    if (value >= 2) return 'var(--c-warn)';
    return 'var(--c-error)';
  }

  correctIndex(item: RankingItem): number {
    return this.currentQuestion().items.findIndex(entry => entry.id === item.id);
  }

  isCorrectPosition(item: RankingItem, index: number): boolean {
    return this.correctIndex(item) === index;
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    const dragIdx = this.dragIndex();
    if (dragIdx === null || this.revealed()) return;
    event.preventDefault();
    const deltaY = event.clientY - this.dragStartY;
    this.dragOffset.set(deltaY);

    const moveBy = Math.round(deltaY / ITEM_HEIGHT);
    if (moveBy === 0) return;

    this.items.update(prev => {
      const next = [...prev];
      const from = this.dragBaseIndex;
      const to = Math.max(0, Math.min(next.length - 1, from + moveBy));
      if (from === to) return prev;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      this.dragBaseIndex = to;
      this.dragStartY += moveBy * ITEM_HEIGHT;
      this.dragOffset.set(deltaY - moveBy * ITEM_HEIGHT);
      return next;
    });
  };

  private readonly onPointerUp = (): void => {
    if (this.dragIndex() === null) return;
    this.dragIndex.set(null);
    this.dragOffset.set(0);
  };

  private prepareQuestion(): void {
    this.revealed.set(false);
    this.timeLeft.set(QUESTION_TIME);
    this.dragIndex.set(null);
    this.dragOffset.set(0);
    this.items.set(this.shuffle(this.currentQuestion().items));
    this.startTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = window.setInterval(() => {
      if (this.revealed()) return;
      const next = this.timeLeft() - 1;
      this.timeLeft.set(Math.max(next, 0));
      if (next <= 0) {
        this.stopTimer();
        this.revealed.set(true);
        const gained = this.scoreForItems(this.items());
        this.score.update(value => value + gained);
        this.analytics.track('quiz_question_timeout', {
          quizId: this.quiz().id,
          qIdx: this.questionIndex(),
        });
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private scoreForItems(items: RankingItem[]): number {
    return items.reduce((sum, item, index) => {
      return sum + (this.correctIndex(item) === index ? 1 : 0);
    }, 0);
  }

  private finishQuiz(): void {
    this.stopTimer();
    const finalScore = this.score();
    const total = this.totalQuestions() * 4;
    const quiz = this.quiz();
    this.store.addPoints(finalScore);
    this.store.recordQuizResult(quiz.id, finalScore, total);
    if (this.isFlowId(quiz.id)) {
      this.store.completeFlow(quiz.id);
    }
    this.analytics.track('quiz_completed', { quizId: quiz.id, score: finalScore, total });
    void this.router.navigate(['/results'], {
      state: { score: finalScore, total, quizTitle: quiz.title },
    });
  }

  private shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
  }

  private isFlowId(value: string): value is FlowId {
    return (FLOW_IDS as readonly string[]).includes(value);
  }

  private readStateString(key: string): string | null {
    const state = window.history.state as Record<string, unknown> | null;
    const value = state?.[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
