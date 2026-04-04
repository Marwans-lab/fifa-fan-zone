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
const ITEM_HEIGHT = 68;
const SLIDE_TRANSITION =
  'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)';
const SLIDE_EXIT_MS = 250;
const CLOSE_DARK_ICON = 'assets/icons/Close-dark.svg';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <main
      class="ranking-quiz"
      data-page="ranking-quiz"
      style="
        min-height: 100dvh;
        display: flex;
        justify-content: center;
        background: var(--c-lt-bg);
        color: var(--c-lt-text-1);
      "
    >
      <section
        class="ranking-quiz__content"
        style="
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
          max-width: 420px;
          margin: 0 auto;
          width: 100%;
        "
      >
        <header
          class="ranking-quiz__header"
          data-section="header"
          style="
            padding: var(--sp-4) var(--sp-5);
            flex-shrink: 0;
            display: flex;
            align-items: center;
            gap: var(--sp-4);
          "
        >
          <button
            type="button"
            class="ranking-quiz__close-btn"
            data-ui="close-btn"
            aria-label="Close quiz"
            (click)="handleBack()"
            style="
              flex-shrink: 0;
              width: 48px;
              height: 48px;
              border-radius: 44px;
              border: var(--f-brand-border-size-default) solid var(--c-lt-surface);
              background: var(--c-lt-surface);
              box-shadow: 0px 2px 4px 0px var(--f-brand-color-shadow-default);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              padding: 0;
            "
          >
            <img [src]="closeDarkIcon" width="24" height="24" alt="" aria-hidden="true" />
          </button>
          <div
            class="ranking-quiz__progress-track"
            style="
              flex: 1;
              height: 8px;
              background: var(--c-lt-surface);
              border-radius: var(--f-brand-radius-rounded);
              overflow: hidden;
            "
          >
            <div
              class="ranking-quiz__progress-fill"
              [style.width.%]="progressPercent()"
              style="
                height: 100%;
                background: linear-gradient(to right, var(--c-correct), var(--c-lt-correct-dark));
                border-radius: 16px;
                box-shadow: var(--c-progress-fill-shadow);
                transition: width var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
              "
            ></div>
          </div>
        </header>

        <div class="ranking-quiz__slide" [ngStyle]="slideStyle()" style="flex: 1; display: flex; flex-direction: column; overflow: hidden">
          <h1
            class="ranking-quiz__question"
            data-section="question"
            style="
              margin: 0;
              padding: 0 var(--sp-6);
              font: 300 24px/32px var(--font-display);
              color: var(--c-lt-text-1);
              text-align: center;
              margin-bottom: var(--sp-6);
              flex-shrink: 0;
            "
          >
            {{ currentQuestion().question }}
          </h1>

          <div class="ranking-quiz__items" style="flex: 1; padding: 0 var(--sp-4); display: flex; flex-direction: column; gap: var(--sp-3)">
            @for (item of items(); track item.id; let idx = $index) {
              <div
                class="ranking-quiz__item"
                (pointerdown)="startDrag(idx, $event)"
                [ngStyle]="rankItemStyle(idx, item)"
                [style.cursor]="revealed() ? 'default' : 'grab'"
                data-section="rank-item"
                style="
                  height: 56px;
                  border-radius: 52px;
                  border: none;
                  background: var(--c-lt-surface);
                  box-shadow: 0px 2px 4px 0px var(--f-brand-color-shadow-default);
                  display: flex;
                  align-items: center;
                  gap: var(--sp-4);
                  padding: 0 var(--sp-2);
                  min-width: 240px;
                  max-width: 560px;
                  user-select: none;
                  touch-action: none;
                "
              >
                <div
                  class="ranking-quiz__item-flag"
                  style="
                    width: 40px;
                    height: 40px;
                    min-width: 40px;
                    border-radius: 40px;
                    background: var(--c-lt-bg);
                    border: 1px solid var(--c-lt-white);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    flex-shrink: 0;
                  "
                >
                  <img [src]="item.flagUrl" width="24" height="24" alt="" aria-hidden="true" style="border-radius: 2px; object-fit: cover" />
                </div>
                <span
                  class="ranking-quiz__item-text"
                  style="
                    flex: 1;
                    font: var(--f-brand-type-body);
                    color: var(--c-lt-text-1);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  "
                >
                  {{ item.label }}
                </span>
                @if (!revealed()) {
                  <div
                    class="ranking-quiz__item-handle"
                    style="
                      width: 40px;
                      height: 40px;
                      min-width: 40px;
                      border-radius: 40px;
                      border: 1px solid var(--c-lt-white);
                      background: transparent;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                    "
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="9" cy="7" r="1.5" fill="var(--c-lt-text-2)" />
                      <circle cx="15" cy="7" r="1.5" fill="var(--c-lt-text-2)" />
                      <circle cx="9" cy="12" r="1.5" fill="var(--c-lt-text-2)" />
                      <circle cx="15" cy="12" r="1.5" fill="var(--c-lt-text-2)" />
                      <circle cx="9" cy="17" r="1.5" fill="var(--c-lt-text-2)" />
                      <circle cx="15" cy="17" r="1.5" fill="var(--c-lt-text-2)" />
                    </svg>
                  </div>
                }
                @if (revealed() && !isCorrectPosition(item, idx)) {
                  <span class="ranking-quiz__item-correct-pos" style="font-size: var(--text-xs); color: var(--c-lt-text-2); flex-shrink: 0; padding-right: var(--sp-2)">
                    #{{ correctIndex(item) + 1 }}
                  </span>
                }
              </div>
            }
          </div>
        </div>

        <div class="ranking-quiz__timer-wrap" data-section="timer" style="display: flex; justify-content: center; margin-top: var(--sp-6); flex-shrink: 0">
          <div class="ranking-quiz__timer" style="position: relative; width: 64px; height: 64px; flex-shrink: 0">
            <svg class="ranking-quiz__timer-svg" width="64" height="64" viewBox="0 0 64 64" style="transform: rotate(-90deg)" aria-hidden="true">
              <circle class="ranking-quiz__timer-track" cx="32" cy="32" r="28" fill="none" stroke="var(--c-lt-border)" stroke-width="3"></circle>
              <circle
                class="ranking-quiz__timer-progress"
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="var(--c-lt-brand)"
                stroke-width="3"
                [attr.stroke-dasharray]="timerCircumference"
                [attr.stroke-dashoffset]="timerOffset()"
                stroke-linecap="round"
                style="transition: stroke-dashoffset var(--f-brand-motion-duration-generous) linear"
              ></circle>
            </svg>
            <span
              class="ranking-quiz__timer-label"
              style="
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--c-lt-text-1);
                font: var(--f-brand-type-headline);
              "
            >
              {{ timeLeft() }}
            </span>
          </div>
        </div>

        <div class="ranking-quiz__footer" style="padding: var(--sp-6) var(--sp-4) var(--sp-8); flex-shrink: 0">
          @if (revealed()) {
            <p
              class="ranking-quiz__feedback"
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
            class="ranking-quiz__submit-btn f-button"
            data-ui="submit-btn"
            (click)="revealed() ? handleNext() : handleSubmit()"
            style="
              width: 100%;
              min-height: var(--sp-14);
              border-radius: var(--f-brand-radius-rounded);
              border: none;
              background: var(--c-lt-brand);
              color: var(--f-brand-color-text-light);
              font: var(--f-brand-type-body-medium);
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: var(--sp-3);
              padding: var(--sp-4) var(--sp-8);
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              transition: background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
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
      .ranking-quiz__submit-btn:hover:not(:disabled) {
        background: var(--f-brand-color-background-primary-hover) !important;
      }
      .ranking-quiz__submit-btn:active:not(:disabled) {
        background: var(--f-brand-color-background-primary-hover) !important;
      }
      .ranking-quiz__submit-btn:disabled {
        background: var(--f-brand-color-background-disabled) !important;
        color: var(--f-brand-color-text-disabled) !important;
        cursor: not-allowed;
      }
      .ranking-quiz__submit-btn:focus-visible {
        outline: var(--f-brand-border-size-focused) solid var(--f-brand-color-border-focused);
        outline-offset: var(--f-brand-space-xs);
      }
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

  readonly closeDarkIcon = CLOSE_DARK_ICON;
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
      transition: SLIDE_TRANSITION,
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
        border: `var(--f-brand-border-size-default) solid var(--c-lt-brand)`,
        background: 'var(--c-lt-brand-bg)',
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
    };
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
    if (value >= 2) return 'var(--c-lt-text-3)';
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
