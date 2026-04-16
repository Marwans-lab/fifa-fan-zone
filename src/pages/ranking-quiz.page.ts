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
const ITEM_HEIGHT = 68; // 56px item + 12px gap (--sp-3)
const STAGGER_MS = 120;
const DROP_SETTLE_MS = 480;
const CORRECT_PULSE_MS = 300;
const SHAKE_MS = 400;
const SHIMMER_MS = 600;
const SPRING_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const SLIDE_TRANSITION =
  'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)';
const SLIDE_EXIT_MS = 250;
const CLOSE_DARK_ICON = 'assets/icons/Close-dark.svg';

type ItemRevealState = 'correct' | 'incorrect';

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
              box-shadow: var(--f-brand-shadow-medium);
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

          <div
            class="ranking-quiz__items"
            [class.ranking-quiz__items--celebrating]="isCelebrating()"
            style="flex: 1; padding: 0 var(--sp-4); display: flex; flex-direction: column; gap: var(--sp-3)"
          >
            @for (item of items(); track item.id; let idx = $index) {
              <div
                class="ranking-quiz__item"
                [class.ranking-quiz__item--shaking]="shakingIndices().includes(idx)"
                [class.ranking-quiz__item--pulsing]="pulsingIndices().includes(idx)"
                [class.ranking-quiz__item--all-celebrating]="celebrateAllItems()"
                [class.ranking-quiz__item--shimmer-correct]="shimmerAllCorrect() && revealStates()[idx] === 'correct'"
                (pointerdown)="startDrag(idx, $event)"
                [ngStyle]="rankItemStyle(idx, item)"
                data-section="rank-item"
                style="
                  height: 56px;
                  border-radius: 52px;
                  border: var(--f-brand-border-size-default) solid transparent;
                  background: var(--c-lt-surface);
                  box-shadow: var(--f-brand-shadow-medium);
                  display: flex;
                  align-items: center;
                  gap: var(--sp-4);
                  padding: 0 var(--sp-2);
                  min-width: 240px;
                  
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
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    flex-shrink: 0;
                  "
                >
                  <img [src]="item.flagUrl" width="24" height="16" alt="" aria-hidden="true" style="border-radius: 2px; object-fit: cover" />
                </div>
                <span
                  class="ranking-quiz__item-text"
                  style="
                    flex: 1;
                    font-size: var(--f-brand-font-caption);
                    color: var(--f-brand-color-text-muted);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  "
                >
                  {{ stripParenthetical(item.label) }}
                </span>
                @if (!revealed() && revealStates()[idx] === undefined) {
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
                @if (revealStates()[idx] === 'incorrect') {
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
            [ngStyle]="submitBtnStyle()"
            style="
              width: 100%;
              min-height: var(--sp-14);
              border-radius: var(--f-brand-radius-rounded);
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
              transition:
                background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default),
                color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default),
                border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
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
      @keyframes ranking-shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-3px); }
        80% { transform: translateX(3px); }
      }
      @keyframes ranking-correct-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.04); }
      }
      @keyframes ranking-celebrate {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      @keyframes ranking-all-celebrate {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.04); }
      }
      @keyframes ranking-shimmer {
        from { background-position: -200% center, center; }
        to { background-position: 200% center, center; }
      }
      .ranking-quiz__item--shaking {
        animation: ranking-shake 400ms cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
      }
      .ranking-quiz__item--pulsing {
        animation: ranking-correct-pulse 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      .ranking-quiz__items--celebrating {
        animation: ranking-celebrate var(--f-brand-motion-duration-quick) cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .ranking-quiz__item--all-celebrating {
        animation: ranking-all-celebrate var(--f-brand-motion-duration-quick) cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        background: var(--c-correct-bg) !important;
      }
      .ranking-quiz__item--shimmer-correct {
        background:
          linear-gradient(90deg, transparent 35%, rgba(255, 255, 255, 0.35) 50%, transparent 65%),
          var(--c-correct-bg) !important;
        background-size: 300% 100%, auto !important;
        animation: ranking-shimmer 600ms ease-in-out forwards;
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

  // Polish signals
  readonly hasReordered = signal(false);
  readonly settlingIndex = signal<number | null>(null);
  readonly revealStates = signal<(ItemRevealState | undefined)[]>([]);
  readonly shakingIndices = signal<number[]>([]);
  readonly pulsingIndices = signal<number[]>([]);
  readonly isCelebrating = signal(false);
  readonly isSubmitting = signal(false);

  // Gap 2: visual gap at drop target during drag
  readonly dropTargetIndex = signal<number | null>(null);

  // Gap 4: perfect score — all items pulse green simultaneously
  readonly celebrateAllItems = signal(false);

  // Gap 5: shimmer sweep on correct items after perfect score pulse
  readonly shimmerAllCorrect = signal(false);

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

  readonly submitBtnStyle = computed((): Record<string, string> => {
    const active = this.hasReordered() || this.revealed();
    if (active) {
      return {
        background: 'var(--c-lt-brand)',
        color: 'var(--f-brand-color-text-light)',
        border: 'none',
      };
    }
    return {
      background: 'var(--c-lt-surface)',
      color: 'var(--c-lt-brand)',
      border: `var(--f-brand-border-size-default) solid var(--c-lt-brand)`,
    };
  });

  private dragStartY = 0;
  private dragBaseIndex = 0;
  private timerId: number | null = null;
  private slideEnterFrameId: number | null = null;
  private slideExitTimeoutId: number | null = null;
  private settleTimerId: number | null = null;
  private revealTimerIds: number[] = [];
  private readonly prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private isAnimating = false;

  // Gap 1: cached item bounding rects for closest-center collision detection
  private itemRects: DOMRect[] = [];

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
    window.addEventListener('pointercancel', this.onPointerUp);
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.clearRevealTimers();
    if (this.settleTimerId !== null) {
      window.clearTimeout(this.settleTimerId);
    }
    if (this.slideEnterFrameId !== null) {
      window.cancelAnimationFrame(this.slideEnterFrameId);
    }
    if (this.slideExitTimeoutId !== null) {
      window.clearTimeout(this.slideExitTimeoutId);
    }
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
  }

  startDrag(index: number, event: PointerEvent): void {
    if (this.revealed() || this.isSubmitting()) return;
    // Gap 1: cache item bounding rects for collision detection throughout the drag
    const itemEls = document.querySelectorAll<HTMLElement>('[data-section="rank-item"]');
    this.itemRects = Array.from(itemEls).map(el => el.getBoundingClientRect());

    this.dragIndex.set(index);
    this.dragOffset.set(0);
    this.dragStartY = event.clientY;
    this.dragBaseIndex = index;
    this.dropTargetIndex.set(index);
    this.hapticFeedback(10);
  }

  handleSubmit(): void {
    if (this.revealed() || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.stopTimer();
    const gained = this.scoreForItems(this.items());
    this.score.update(value => value + gained);
    this.analytics.track('quiz_answer', {
      quizId: this.quiz().id,
      qIdx: this.questionIndex(),
      correctPositions: gained,
    });

    if (this.prefersReducedMotion) {
      this.revealAll();
      this.revealed.set(true);
      return;
    }

    const snapshot = this.items();
    snapshot.forEach((item, idx) => {
      const timerId = window.setTimeout(() => {
        const correct = this.isCorrectPosition(item, idx);
        this.revealStates.update(states => {
          const next = [...states];
          next[idx] = correct ? 'correct' : 'incorrect';
          return next;
        });

        if (correct) {
          this.pulsingIndices.update(prev => [...prev, idx]);
          window.setTimeout(() => {
            this.pulsingIndices.update(prev => prev.filter(i => i !== idx));
          }, CORRECT_PULSE_MS);
        } else {
          this.hapticFeedback([15, 30, 15]);
          this.shakingIndices.update(prev => [...prev, idx]);
          window.setTimeout(() => {
            this.shakingIndices.update(prev => prev.filter(i => i !== idx));
          }, SHAKE_MS);
        }

        if (idx === snapshot.length - 1) {
          const finalRevealDelay = Math.max(CORRECT_PULSE_MS, SHAKE_MS) + 50;
          const revealTimerId = window.setTimeout(() => {
            this.revealed.set(true);
            if (gained === snapshot.length) {
              // Gap 4: container bounce + all items pulse green simultaneously
              this.isCelebrating.set(true);
              this.celebrateAllItems.set(true);
              this.hapticFeedback([10, 20, 10, 20, 30]);
              const celebrateTimerId = window.setTimeout(() => {
                this.isCelebrating.set(false);
                this.celebrateAllItems.set(false);
                // Gap 5: shimmer sweep on correct items after pulse completes
                if (!this.prefersReducedMotion) {
                  this.shimmerAllCorrect.set(true);
                  const shimmerTimerId = window.setTimeout(() => {
                    this.shimmerAllCorrect.set(false);
                  }, SHIMMER_MS);
                  this.revealTimerIds.push(shimmerTimerId);
                }
              }, DROP_SETTLE_MS);
              this.revealTimerIds.push(celebrateTimerId);
            }
          }, finalRevealDelay);
          this.revealTimerIds.push(revealTimerId);
        }
      }, idx * STAGGER_MS);
      this.revealTimerIds.push(timerId);
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
    const dragIdx = this.dragIndex();
    const dropTarget = this.dropTargetIndex();
    const settling = this.settlingIndex() === index;
    const revealState = this.revealStates()[index];

    if (dragIdx === index) {
      return {
        transform: `translateY(${this.dragOffset()}px) scale(1.03)`,
        border: `var(--f-brand-border-size-default) solid var(--c-lt-brand)`,
        background: 'var(--c-lt-surface)',
        zIndex: '50',
        position: 'relative',
        boxShadow: 'var(--f-brand-shadow-large)',
        transition: `transform var(--f-brand-motion-duration-instant) ${SPRING_EASING}`,
        cursor: 'grabbing',
      };
    }

    // Gap 2: shift non-dragged items to open a visual gap at the drop target
    if (dragIdx !== null && dropTarget !== null && dragIdx !== dropTarget) {
      const src = dragIdx;
      const dst = dropTarget;
      if (dst > src && index > src && index <= dst) {
        // Dragging down: shift items between src+1..dst UP to fill src's vacancy
        return {
          transform: `translateY(-${ITEM_HEIGHT}px)`,
          transition: `transform var(--f-brand-motion-duration-instant) ${SPRING_EASING}`,
          background: 'var(--c-lt-surface)',
          cursor: 'grab',
        };
      }
      if (dst < src && index >= dst && index < src) {
        // Dragging up: shift items between dst..src-1 DOWN to fill src's vacancy
        return {
          transform: `translateY(${ITEM_HEIGHT}px)`,
          transition: `transform var(--f-brand-motion-duration-instant) ${SPRING_EASING}`,
          background: 'var(--c-lt-surface)',
          cursor: 'grab',
        };
      }
    }

    if (settling) {
      const offset = this.dragOffset();
      const isAtRest = offset === 0;
      return {
        transform: `translateY(${offset}px) scale(${isAtRest ? '1' : '1.03'})`,
        transition: `transform var(--f-brand-motion-duration-quick) ${SPRING_EASING}, box-shadow var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default), border-color var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default)`,
        // Gap 3: use the FDS shadow-medium token instead of hardcoded value
        boxShadow: isAtRest ? 'var(--f-brand-shadow-medium)' : 'var(--f-brand-shadow-large)',
        border: isAtRest ? 'var(--f-brand-border-size-default) solid transparent' : `var(--f-brand-border-size-default) solid var(--c-lt-brand)`,
        background: 'var(--c-lt-surface)',
        zIndex: '50',
        position: 'relative',
        cursor: 'grab',
      };
    }

    if (revealState === 'correct') {
      return {
        border: `var(--f-brand-border-size-default) solid var(--c-correct-border)`,
        background: 'var(--c-correct-bg)',
        transition: `background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)`,
        cursor: 'default',
      };
    }

    if (revealState === 'incorrect') {
      return {
        border: `var(--f-brand-border-size-default) solid var(--c-error-border)`,
        background: 'var(--c-error-bg)',
        transition: `background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)`,
        cursor: 'default',
      };
    }

    // Default: spring transition for liquid sort feel
    return {
      transition: `transform var(--f-brand-motion-duration-instant) ${SPRING_EASING}, border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)`,
      background: 'var(--c-lt-surface)',
      cursor: this.revealed() ? 'default' : 'grab',
    };
  }

  buttonLabel(): string {
    if (!this.revealed()) return 'Lock in order';
    const isLast = this.questionIndex() >= this.totalQuestions() - 1;
    if (!isLast) return 'Next';
    return `Finish · ${this.score()}/${this.totalQuestions() * this.currentQuestion().items.length}`;
  }

  feedbackText(): string {
    const value = this.questionScore();
    const itemCount = this.currentQuestion().items.length;
    if (value === itemCount) return `✓ Perfect order! +${itemCount} points`;
    return `${value}/${itemCount} correct positions`;
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

  // Gap 1: closest-center collision detection using cached item rects
  private readonly onPointerMove = (event: PointerEvent): void => {
    const dragIdx = this.dragIndex();
    if (dragIdx === null || this.revealed()) return;
    event.preventDefault();

    const deltaY = event.clientY - this.dragStartY;
    const count = this.items().length;

    // Determine drop target by comparing dragged item center against each item's center
    const srcRect = this.itemRects[dragIdx];
    if (!srcRect) {
      this.dragOffset.set(deltaY);
      return;
    }

    const dragCenterY = srcRect.top + srcRect.height / 2 + deltaY;
    let newTarget = count - 1; // default: end of list

    for (let i = 0; i < count; i++) {
      if (i === dragIdx) continue;
      const rect = this.itemRects[i];
      if (!rect) continue;
      const itemCenterY = rect.top + rect.height / 2;
      if (dragCenterY < itemCenterY) {
        // Insert before item i; adjust index to account for dragIdx removal
        newTarget = i <= dragIdx ? i : i - 1;
        break;
      }
    }

    this.dropTargetIndex.set(newTarget);
    if (newTarget !== this.dragBaseIndex) {
      this.hasReordered.set(true);
    }

    // Elastic resistance: tile naturally aligns with its target slot; only absorb
    // the overscroll when the user drags past the first or last boundary.
    // This prevents the tile from appearing stuck in the middle of a neighbor.
    const naturalOffset = (newTarget - this.dragBaseIndex) * ITEM_HEIGHT;
    const atTop = newTarget === 0 && deltaY < naturalOffset;
    const atBottom = newTarget === count - 1 && deltaY > naturalOffset;

    if (atTop || atBottom) {
      const overDrag = deltaY - naturalOffset;
      this.dragOffset.set(naturalOffset + overDrag * 0.3);
    } else {
      this.dragOffset.set(deltaY);
    }
  };

  // Gap 2: reorder on drop and compute remaining offset for seamless settle transition
  private readonly onPointerUp = (): void => {
    if (this.dragIndex() === null) return;
    this.hapticFeedback(5);
    const dragIdx = this.dragIndex()!;
    const target = this.dropTargetIndex() ?? dragIdx;
    const currentOffset = this.dragOffset();

    // Compute the remaining displacement so the item settles smoothly from its
    // visual drop position to the new flex slot (avoids a visible jump on reorder)
    const remainingOffset = (dragIdx - target) * ITEM_HEIGHT + currentOffset;

    if (target !== dragIdx) {
      this.items.update(prev => {
        const next = [...prev];
        const [moved] = next.splice(dragIdx, 1);
        next.splice(target, 0, moved);
        return next;
      });
    }

    this.dragIndex.set(null);
    this.dropTargetIndex.set(null);
    this.settlingIndex.set(target);
    this.dragOffset.set(remainingOffset);

    // rAF ensures the transition fires from remainingOffset → 0
    window.requestAnimationFrame(() => {
      this.dragOffset.set(0);
      if (this.settleTimerId !== null) {
        window.clearTimeout(this.settleTimerId);
      }
      this.settleTimerId = window.setTimeout(() => {
        this.settlingIndex.set(null);
        this.settleTimerId = null;
      }, DROP_SETTLE_MS);
    });
  };

  private prepareQuestion(): void {
    this.revealed.set(false);
    this.isSubmitting.set(false);
    this.timeLeft.set(QUESTION_TIME);
    this.dragIndex.set(null);
    this.dragOffset.set(0);
    this.settlingIndex.set(null);
    this.dropTargetIndex.set(null);
    this.hasReordered.set(false);
    this.revealStates.set([]);
    this.shakingIndices.set([]);
    this.pulsingIndices.set([]);
    this.isCelebrating.set(false);
    this.celebrateAllItems.set(false);
    this.shimmerAllCorrect.set(false);
    this.itemRects = [];
    this.clearRevealTimers();
    if (this.settleTimerId !== null) {
      window.clearTimeout(this.settleTimerId);
      this.settleTimerId = null;
    }
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
      if (this.revealed() || this.isSubmitting()) return;
      const next = this.timeLeft() - 1;
      this.timeLeft.set(Math.max(next, 0));
      if (next <= 0) {
        this.stopTimer();
        const gained = this.scoreForItems(this.items());
        this.score.update(value => value + gained);
        this.analytics.track('quiz_question_timeout', {
          quizId: this.quiz().id,
          qIdx: this.questionIndex(),
        });
        this.revealAll();
        this.revealed.set(true);
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private revealAll(): void {
    const states = this.items().map((item, idx) =>
      this.isCorrectPosition(item, idx) ? 'correct' : ('incorrect' as ItemRevealState),
    );
    this.revealStates.set(states);
  }

  private clearRevealTimers(): void {
    this.revealTimerIds.forEach(id => window.clearTimeout(id));
    this.revealTimerIds = [];
  }

  private hapticFeedback(pattern: number | number[]): void {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Progressive enhancement — not available on iOS Safari
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
    const total = this.totalQuestions() * this.quiz().questions[0].items.length;
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

  stripParenthetical(label: string): string {
    return label.replace(/\s*\([\d,]+\)/g, '').trim();
  }

  private readStateString(key: string): string | null {
    const state = window.history.state as Record<string, unknown> | null;
    const value = state?.[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
