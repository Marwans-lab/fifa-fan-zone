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

import { RANKING_QUIZZES, type RankingItem, type RankingQuiz } from '../data/rankingQuizzes';
import { FLOW_IDS, type FlowId } from '../models/flow-id.model';
import { AnalyticsService } from '../services/analytics.service';
import { StoreService } from '../services/store.service';

const QUESTION_TIME = 15;
const ITEM_HEIGHT = 70;
const SLIDE_TRANSITION =
  'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)';
const SLIDE_EXIT_TRANSITION =
  'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)';
const SLIDE_EXIT_MS = 250;
const CHEVRON_LEFT_WHITE_ICON = 'assets/icons/Chevron-left-white.svg';

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
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
          max-width: 420px;
          margin: 0 auto;
          width: 100%;
        "
      >
        <header data-section="header" style="padding: var(--sp-4); flex-shrink: 0">
          <div style="display: flex; align-items: center; gap: var(--sp-3)">
            <button
              type="button"
              class="btn-icon"
              data-ui="back-btn"
              aria-label="Go back"
              (click)="handleBack()"
            >
              <img [src]="chevronLeftWhiteIcon" width="24" height="24" alt="Back" />
            </button>
            <div
              style="
                flex: 1;
                height: var(--sp-1);
                background: var(--c-surface-raise);
                border-radius: calc(var(--sp-1) / 2);
                overflow: hidden;
              "
            >
              <div
                [style.width.%]="progressPercent()"
                style="
                  height: 100%;
                  background: var(--c-accent);
                  border-radius: calc(var(--sp-1) / 2);
                  transition: width var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
                "
              ></div>
            </div>
            <span style="font-size: var(--text-xs); color: var(--c-text-2); flex-shrink: 0">
              {{ questionIndex() + 1 }}/{{ totalQuestions() }}
            </span>
          </div>
        </header>

        <div [ngStyle]="slideStyle()" style="flex: 1; display: flex; flex-direction: column; overflow: hidden">
          <div data-section="timer" style="display: flex; justify-content: center; margin-bottom: var(--sp-4); flex-shrink: 0">
            <div style="position: relative; width: 64px; height: 64px; flex-shrink: 0">
              <svg width="64" height="64" viewBox="0 0 64 64" style="transform: rotate(-90deg)" aria-hidden="true">
                <circle cx="32" cy="32" r="28" fill="none" stroke="var(--c-surface)" stroke-width="3"></circle>
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="var(--c-white)"
                  stroke-width="3"
                  [attr.stroke-dasharray]="timerCircumference"
                  [attr.stroke-dashoffset]="timerOffset()"
                  stroke-linecap="round"
                  style="transition: stroke-dashoffset var(--f-brand-motion-duration-generous) linear"
                ></circle>
              </svg>
              <span
                style="
                  position: absolute;
                  inset: 0;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: var(--c-white);
                  font: var(--f-brand-type-subheading-medium);
                "
              >
                {{ timeLeft() }}
              </span>
            </div>
          </div>

          <h1
            data-section="question"
            style="
              margin: 0;
              padding: 0 var(--sp-6);
              font: var(--f-brand-type-title-3);
              font-size: var(--text-xl);
              color: var(--c-text-1);
              line-height: var(--leading-tight);
              letter-spacing: var(--tracking-tight);
              text-align: center;
              margin-bottom: var(--sp-6);
              flex-shrink: 0;
            "
          >
            {{ currentQuestion().question }}
          </h1>

          <div style="flex: 1; padding: 0 var(--sp-4); display: flex; flex-direction: column; gap: var(--sp-3)">
            @for (item of items(); track item.id; let idx = $index) {
              <div
                (pointerdown)="startDrag(idx, $event)"
                [ngStyle]="rankItemStyle(idx, item)"
                [style.cursor]="revealed() ? 'default' : 'grab'"
                data-section="rank-item"
                style="
                  height: 58px;
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
                <span
                  style="flex: 1; font-size: var(--text-md); color: var(--c-text-1)"
                  [style.font-weight]="dragIndex() === idx ? '600' : '400'"
                >
                  {{ item.label }}
                </span>
                @if (!revealed()) {
                  <div
                    style="
                      display: flex;
                      flex-direction: column;
                      gap: 2px;
                      opacity: 0.3;
                      flex-shrink: 0;
                      padding: 0 var(--sp-1);
                    "
                  >
                    <div style="width: 16px; height: 2px; background: var(--c-text-1); border-radius: 1px"></div>
                    <div style="width: 16px; height: 2px; background: var(--c-text-1); border-radius: 1px"></div>
                    <div style="width: 16px; height: 2px; background: var(--c-text-1); border-radius: 1px"></div>
                  </div>
                }
                @if (revealed() && !isCorrectPosition(item, idx)) {
                  <span style="font-size: var(--text-xs); color: var(--c-text-2); flex-shrink: 0">
                    #{{ correctIndex(item) + 1 }}
                  </span>
                }
              </div>
            }
          </div>
        </div>

        <div style="padding: var(--sp-5) var(--sp-4) var(--sp-8); flex-shrink: 0">
          @if (revealed()) {
            <p
              style="
                margin: 0 0 var(--sp-3);
                text-align: center;
                font: var(--f-brand-type-subheading-medium);
                letter-spacing: var(--tracking-wide);
              "
              [style.color]="feedbackColor()"
            >
              {{ feedbackText() }}
            </p>
          }
          <button
            type="button"
            class="btn"
            data-ui="submit-btn"
            (click)="revealed() ? handleNext() : handleSubmit()"
            style="
              width: 100%;
              min-height: var(--sp-14);
              border-radius: var(--f-brand-radius-rounded);
              border: none;
              background: var(--c-white);
              color: var(--c-brand);
              font: var(--f-brand-type-body-medium);
              font-size: var(--text-md);
              cursor: pointer;
              transition:
                background var(--dur-base) var(--ease-out),
                color var(--dur-base) var(--ease-out);
            "
          >
            {{ buttonLabel() }}
          </button>
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      @media (prefers-reduced-motion: reduce) {
        [data-page='ranking-quiz'],
        [data-page='ranking-quiz'] * {
          animation-duration: 0.01ms !important;
          animation-delay: 0ms !important;
          transition-duration: 0.01ms !important;
          transition-delay: 0ms !important;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankingQuizPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(StoreService);
  private readonly analytics = inject(AnalyticsService);

  readonly chevronLeftWhiteIcon = CHEVRON_LEFT_WHITE_ICON;
  readonly quiz = signal<RankingQuiz>(RANKING_QUIZZES[0]);
  readonly questionIndex = signal(0);
  readonly score = signal(0);
  readonly revealed = signal(false);
  readonly timeLeft = signal(QUESTION_TIME);
  readonly items = signal<RankingItem[]>([]);
  readonly dragIndex = signal<number | null>(null);
  readonly dragOffset = signal(0);
  readonly slideStyle = signal<Record<string, string>>({
    transform: 'translateX(0)',
    opacity: '1',
    transition: SLIDE_TRANSITION,
  });

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
  private slideEnterFrameId: number | null = null;
  private slideExitTimeoutId: number | null = null;
  private readonly prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private isAnimating = false;

  ngOnInit(): void {
    const routeQuizId = this.route.snapshot.paramMap.get('quizId');
    const stateQuizId = this.readStateString('quizId');
    const quizId = routeQuizId ?? stateQuizId;
    const quiz = RANKING_QUIZZES.find(entry => entry.id === quizId) ?? RANKING_QUIZZES[0];
    this.quiz.set(quiz);
    this.prepareQuestion();
    this.triggerSlideIn();
    this.analytics.track('ranking_quiz_viewed', { quizId: quiz.id });
    window.addEventListener('pointermove', this.onPointerMove, { passive: false });
    window.addEventListener('pointerup', this.onPointerUp);
  }

  ngOnDestroy(): void {
    this.stopTimer();
    if (this.slideEnterFrameId !== null) {
      window.cancelAnimationFrame(this.slideEnterFrameId);
    }
    if (this.slideExitTimeoutId !== null) {
      window.clearTimeout(this.slideExitTimeoutId);
    }
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
    if (this.isAnimating) return;
    const isLast = this.questionIndex() >= this.totalQuestions() - 1;
    if (isLast) {
      this.finishQuiz();
      return;
    }
    if (this.prefersReducedMotion) {
      this.advanceToNextQuestion();
      return;
    }

    this.isAnimating = true;
    this.slideStyle.set({
      transform: 'translateX(-60px)',
      opacity: '0',
      transition: SLIDE_EXIT_TRANSITION,
    });

    if (this.slideExitTimeoutId !== null) {
      window.clearTimeout(this.slideExitTimeoutId);
    }
    this.slideExitTimeoutId = window.setTimeout(() => {
      this.advanceToNextQuestion();
      this.isAnimating = false;
      this.triggerSlideIn();
      this.slideExitTimeoutId = null;
    }, SLIDE_EXIT_MS);
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
        boxShadow: 'var(--f-brand-shadow-large)',
        transition: 'none',
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
      transition:
        'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
      boxShadow: 'none',
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
    return this.isCorrectPosition(item, index) ? '✓' : '✗';
  }

  buttonLabel(): string {
    if (!this.revealed()) return 'Lock in order';
    const isLast = this.questionIndex() >= this.totalQuestions() - 1;
    if (!isLast) return 'Next';
    return `Finish · ${this.score()}/${this.totalQuestions() * 4}`;
  }

  feedbackText(): string {
    const value = this.questionScore();
    if (value === 4) return '✓ Perfect order! +4 points';
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

  private advanceToNextQuestion(): void {
    this.questionIndex.update(value => value + 1);
    this.prepareQuestion();
  }

  private triggerSlideIn(): void {
    if (this.prefersReducedMotion) {
      this.slideStyle.set({
        transform: 'translateX(0)',
        opacity: '1',
        transition: 'none',
      });
      return;
    }

    if (this.slideEnterFrameId !== null) {
      window.cancelAnimationFrame(this.slideEnterFrameId);
    }
    this.slideStyle.set({
      transform: 'translateX(60px)',
      opacity: '0',
      transition: 'none',
    });
    this.slideEnterFrameId = window.requestAnimationFrame(() => {
      this.slideStyle.set({
        transform: 'translateX(0)',
        opacity: '1',
        transition: SLIDE_TRANSITION,
      });
      this.slideEnterFrameId = null;
    });
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
