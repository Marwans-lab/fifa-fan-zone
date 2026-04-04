import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ScreenComponent } from '../components/screen/screen.component';
import { SWIPE_QUIZZES, type SwipeQuiz } from '../data/swipeQuizzes';
import { FLOW_IDS, type FlowId } from '../models/flow-id.model';
import { AnalyticsService } from '../services/analytics.service';
import { StoreService } from '../services/store.service';

const SWIPE_THRESHOLD = 80;
const ROTATION_FACTOR = 0.12;
const FEEDBACK_DURATION = 1200;
const EXIT_DURATION = 420;

@Component({
  standalone: true,
  imports: [CommonModule, ScreenComponent],
  template: `
    <app-screen className="f-page-enter swipe-quiz-screen">
      <main
        class="swipe-quiz"
        data-page="swipe-quiz"
        style="
          min-height: 100dvh;
          display: flex;
          justify-content: center;
          color: var(--c-lt-text-1);
        "
      >
      <section
        class="swipe-quiz__content"
        style="
          width: 100%;
          max-width: 420px;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
        "
      >
        <header class="swipe-quiz__header" style="padding: var(--sp-5) var(--sp-4); flex-shrink: 0; display: flex; align-items: center; gap: var(--sp-4);">
          <button
            class="swipe-quiz__close-btn"
            type="button"
            data-ui="close-btn"
            aria-label="Close quiz"
            (click)="handleBack()"
            style="
              width: 48px;
              min-height: 48px;
              padding: 0;
              border-radius: 44px;
              background: var(--c-lt-surface);
              border: var(--f-brand-border-size-default) solid var(--c-lt-surface);
              box-shadow: 0px 2px 4px 0px var(--f-brand-color-shadow-default);
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              cursor: pointer;
            "
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="var(--c-lt-text-1)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <div
            class="swipe-quiz__progress-track"
            style="
              flex: 1;
              height: 8px;
              background: var(--c-lt-surface);
              border-radius: var(--f-brand-radius-rounded);
              overflow: hidden;
            "
          >
            <div
              class="swipe-quiz__progress-fill"
              [style.width]="progressWidth()"
              style="
                height: 100%;
                background: var(--f-brand-color-flight-status-confirmed);
                border-radius: 16px;
                box-shadow: var(--c-progress-fill-shadow);
                transition: width var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
              "
            ></div>
          </div>
        </header>

        <div
          class="swipe-quiz__card-stack"
          (pointerdown)="handlePointerDown($event)"
          (pointermove)="handlePointerMove($event)"
          (pointerup)="handlePointerUp()"
          (pointercancel)="handlePointerUp()"
          [style.cursor]="isDragging() ? 'grabbing' : 'grab'"
          style="
            flex: 1;
            position: relative;
            overflow: hidden;
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
          "
        >
          <div
            class="swipe-quiz__card-bg-wrap"
            style="
              position: absolute;
              inset: 0;
              display: flex;
              align-items: stretch;
              justify-content: center;
              padding: var(--sp-4);
              z-index: 1;
            "
          >
            <div
              class="swipe-quiz__card-bg"
              [ngStyle]="backgroundCardStyle()"
              style="
                width: 100%;
                max-width: calc(var(--sp-20) * 4 + var(--sp-5));
                flex: 1;
                min-height: 300px;
                border-radius: var(--f-brand-radius-outer);
                background: var(--c-lt-surface);
                border: var(--f-brand-border-size-default) solid var(--c-lt-border);
              "
            ></div>
          </div>

          <div
            class="swipe-quiz__card-active"
            [ngStyle]="activeCardStyle()"
            style="
              position: absolute;
              inset: 0;
              z-index: 2;
            "
          >
            <article
              class="swipe-quiz__card"
              [ngStyle]="cardStyle()"
              style="
                position: absolute;
                inset: 0;
                display: flex;
                align-items: stretch;
                justify-content: center;
                padding: var(--sp-4);
                z-index: 5;
              "
            >
              <div
                class="swipe-quiz__card-body"
                [ngStyle]="cardBodyStyle()"
                style="
                  position: relative;
                  width: 100%;
                  max-width: calc(var(--sp-20) * 4 + var(--sp-5));
                  flex: 1;
                  min-height: 300px;
                  border-radius: var(--f-brand-radius-outer);
                  background: var(--c-lt-surface);
                  display: flex;
                  flex-direction: column;
                  overflow: hidden;
                "
              >
                <span
                  class="swipe-quiz__card-label swipe-quiz__card-label--true"
                  [style.opacity]="trueLabelOpacity()"
                  style="
                    position: absolute;
                    top: var(--sp-6);
                    right: var(--sp-6);
                    padding: var(--sp-1) var(--sp-4);
                    border-radius: var(--f-brand-radius-base);
                    border: var(--f-brand-border-size-focused) solid var(--f-brand-color-border-success);
                    color: var(--f-brand-color-border-success);
                    font: var(--f-brand-type-headline-medium);
                    font-weight: var(--weight-med);
                    letter-spacing: var(--tracking-wide);
                    text-transform: uppercase;
                    transform: rotate(-12deg);
                    transition: opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
                    pointer-events: none;
                    z-index: 10;
                  "
                >
                  {{ labels().right }}
                </span>
                <span
                  class="swipe-quiz__card-label swipe-quiz__card-label--false"
                  [style.opacity]="falseLabelOpacity()"
                  style="
                    position: absolute;
                    top: var(--sp-6);
                    left: var(--sp-6);
                    padding: var(--sp-1) var(--sp-4);
                    border-radius: var(--f-brand-radius-base);
                    border: var(--f-brand-border-size-focused) solid var(--f-brand-color-status-error);
                    color: var(--f-brand-color-status-error);
                    font: var(--f-brand-type-headline-medium);
                    font-weight: var(--weight-med);
                    letter-spacing: var(--tracking-wide);
                    text-transform: uppercase;
                    transform: rotate(12deg);
                    transition: opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
                    pointer-events: none;
                    z-index: 10;
                  "
                >
                  {{ labels().left }}
                </span>

                <div
                  class="swipe-quiz__feedback"
                  [ngStyle]="feedbackOverlayStyle()"
                  style="
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: var(--sp-4);
                    padding: var(--sp-8);
                    pointer-events: none;
                    z-index: 20;
                  "
                >
                  <div
                    class="swipe-quiz__feedback-icon"
                    [ngStyle]="feedbackIconStyle()"
                    style="
                      width: var(--sp-18);
                      min-height: var(--sp-18);
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    "
                  >
                    @if (isFeedbackCorrect()) {
                      <svg class="swipe-quiz__icon-check" width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M5 13l4 4L19 7"
                          stroke="var(--f-brand-color-border-success)"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    } @else {
                      <svg class="swipe-quiz__icon-x" width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M18 6L6 18M6 6l12 12"
                          stroke="var(--f-brand-color-status-error)"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    }
                  </div>
                  <span
                    class="swipe-quiz__feedback-text"
                    [style.color]="isFeedbackCorrect() ? 'var(--f-brand-color-border-success)' : 'var(--f-brand-color-status-error)'"
                    style="
                      font: var(--f-brand-type-title-3);
                      font-weight: var(--weight-light);
                      letter-spacing: var(--tracking-wide);
                    "
                  >
                    {{ isFeedbackCorrect() ? 'Correct!' : 'Wrong!' }}
                  </span>
                  <span
                    class="swipe-quiz__feedback-explanation"
                    style="
                      font: var(--f-brand-type-caption);
                      color: var(--c-lt-text-3);
                      text-align: center;
                      line-height: var(--leading-snug);
                      max-width: calc(var(--sp-20) * 3 + var(--sp-5));
                    "
                  >
                    {{ currentStatement().explanation }}
                  </span>
                </div>

                <div
                  class="swipe-quiz__card-image"
                  style="
                    flex: 1;
                    overflow: hidden;
                    position: relative;
                  "
                >
                  <img
                    [src]="currentStatement().imageUrl"
                    alt=""
                    aria-hidden="true"
                    style="
                      width: 100%;
                      height: 100%;
                      object-fit: cover;
                      display: block;
                    "
                  />
                </div>

                <div
                  class="swipe-quiz__card-content"
                  [style.opacity]="isFeedbackVisible() ? '0' : '1'"
                  style="
                    background: var(--c-lt-surface);
                    padding: var(--sp-4);
                    display: flex;
                    flex-direction: column;
                    gap: var(--sp-3);
                    text-align: center;
                    transition: opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
                    z-index: 1;
                  "
                >
                  <span
                    class="swipe-quiz__card-question-label"
                    style="
                      font: var(--f-brand-type-body-medium);
                      color: var(--c-lt-brand);
                      text-align: center;
                      white-space: nowrap;
                      overflow: hidden;
                      text-overflow: ellipsis;
                    "
                  >
                    Question {{ currentIndex() + 1 }}
                  </span>

                  <div
                    class="swipe-quiz__statement"
                    style="
                      font: 300 24px/32px var(--font-display);
                      color: var(--c-lt-text-1);
                      text-align: center;
                      max-height: 96px;
                      overflow: hidden;
                    "
                  >
                    {{ currentStatement().statement }}
                  </div>

                  <div
                    class="swipe-quiz__swipe-hint"
                    style="
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      gap: var(--sp-1);
                    "
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M15 18l-6-6 6-6"
                        stroke="var(--c-lt-text-3)"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <span
                      style="
                        font: var(--f-brand-type-subheading);
                        color: var(--c-lt-text-3);
                      "
                    >
                      Swipe right or left
                    </span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M9 18l6-6-6-6"
                        stroke="var(--c-lt-text-3)"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        <div
          class="swipe-quiz__labels"
          style="
            display: flex;
            justify-content: space-between;
            padding: 0 var(--sp-8);
            flex-shrink: 0;
          "
        >
          <span
            class="swipe-quiz__label swipe-quiz__label--left"
            style="
              font: var(--f-brand-type-caption-medium);
              color: var(--f-brand-color-status-error);
              letter-spacing: var(--tracking-wide);
              text-transform: uppercase;
              opacity: 0.6;
            "
          >
            {{ labels().left }}
          </span>
          <span
            class="swipe-quiz__label swipe-quiz__label--right"
            style="
              font: var(--f-brand-type-caption-medium);
              color: var(--f-brand-color-border-success);
              letter-spacing: var(--tracking-wide);
              text-transform: uppercase;
              opacity: 0.6;
            "
          >
            {{ labels().right }}
          </span>
        </div>

        <div class="swipe-quiz__actions" style="padding: var(--sp-4) var(--sp-4) var(--sp-8); flex-shrink: 0;">
          <div class="swipe-quiz__actions-row" style="display: flex; align-items: center; justify-content: center; gap: var(--sp-10);">
            <button
              class="swipe-quiz__action-btn swipe-quiz__action-btn--false"
              type="button"
              data-ui="swipe-false-btn"
              [attr.aria-label]="labels().left"
              [disabled]="actionsDisabled()"
              (click)="answerWithDirection('left')"
              (pointerdown)="handleActionPointerDown($event)"
              (pointerup)="handleActionPointerUp($event)"
              (pointerleave)="handleActionPointerUp($event)"
              [ngStyle]="actionButtonStyle('left')"
            >
              <svg class="swipe-quiz__action-icon swipe-quiz__action-icon--x" width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="var(--f-brand-color-status-error)"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <button
              class="swipe-quiz__action-btn swipe-quiz__action-btn--true"
              type="button"
              data-ui="swipe-true-btn"
              [attr.aria-label]="labels().right"
              [disabled]="actionsDisabled()"
              (click)="answerWithDirection('right')"
              (pointerdown)="handleActionPointerDown($event)"
              (pointerup)="handleActionPointerUp($event)"
              (pointerleave)="handleActionPointerUp($event)"
              [ngStyle]="actionButtonStyle('right')"
            >
              <svg class="swipe-quiz__action-icon swipe-quiz__action-icon--check" width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="var(--f-brand-color-border-success)"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </section>
      </main>
    </app-screen>
  `,
  styles: [
    `
      .swipe-quiz-screen {
        background: var(--c-lt-bg);
      }

      @media (prefers-reduced-motion: reduce) {
        [data-page='swipe-quiz'],
        [data-page='swipe-quiz'] * {
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
export class SwipeQuizPage implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(StoreService);
  private readonly analytics = inject(AnalyticsService);

  readonly quiz = signal<SwipeQuiz>(SWIPE_QUIZZES[0]);
  readonly currentIndex = signal(0);
  readonly score = signal(0);
  readonly results = signal<(boolean | null)[]>([]);
  readonly cardOffsetX = signal(0);
  readonly isDragging = signal(false);
  readonly feedbackState = signal<'correct' | 'incorrect' | null>(null);
  readonly exitDirection = signal<'left' | 'right' | null>(null);
  readonly isTransitioning = signal(false);
  readonly enterAnim = signal(true);

  readonly totalStatements = computed(() => this.quiz().statements.length);
  readonly currentStatement = computed(() => this.quiz().statements[this.currentIndex()]);
  readonly labels = computed(() => this.quiz().labels ?? { right: 'True', left: 'False' });
  readonly hasNextCard = computed(() => this.currentIndex() < this.totalStatements() - 1);
  readonly progressWidth = computed(() => `${(this.currentIndex() / this.totalStatements()) * 100}%`);
  readonly isFeedbackVisible = computed(() => this.feedbackState() !== null);
  readonly isFeedbackCorrect = computed(() => this.feedbackState() === 'correct');
  readonly actionsDisabled = computed(() => this.isTransitioning() || this.feedbackState() !== null);
  readonly trueLabelOpacity = computed(() => Math.min(Math.max(this.cardOffsetX() / SWIPE_THRESHOLD, 0), 1));
  readonly falseLabelOpacity = computed(() => Math.min(Math.max(-this.cardOffsetX() / SWIPE_THRESHOLD, 0), 1));

  private dragStartX = 0;
  private readonly prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  ngOnInit(): void {
    const routeQuizId = this.route.snapshot.paramMap.get('quizId');
    const stateQuizId = this.readStateString('quizId');
    const quizId = routeQuizId ?? stateQuizId;
    const resolvedQuiz = SWIPE_QUIZZES.find(quiz => quiz.id === quizId) ?? SWIPE_QUIZZES[0];
    this.quiz.set(resolvedQuiz);
    this.results.set(Array(resolvedQuiz.statements.length).fill(null) as (boolean | null)[]);
    this.triggerEnterAnimation();
    this.analytics.track('swipe_quiz_viewed', { quizId: resolvedQuiz.id });
  }

  handlePointerDown(event: PointerEvent): void {
    if (this.actionsDisabled()) return;
    this.dragStartX = event.clientX;
    this.isDragging.set(true);
    (event.target as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
  }

  handlePointerMove(event: PointerEvent): void {
    if (!this.isDragging() || this.actionsDisabled()) return;
    this.cardOffsetX.set(event.clientX - this.dragStartX);
  }

  handlePointerUp(): void {
    if (!this.isDragging()) return;
    this.isDragging.set(false);
    const offset = this.cardOffsetX();
    if (Math.abs(offset) >= SWIPE_THRESHOLD) {
      this.answerWithDirection(offset > 0 ? 'right' : 'left');
      return;
    }
    this.cardOffsetX.set(0);
  }

  answerWithDirection(direction: 'left' | 'right'): void {
    if (this.actionsDisabled()) return;
    this.isTransitioning.set(true);
    const swipedRight = direction === 'right';
    const statement = this.currentStatement();
    const correct = swipedRight === statement.isTrue;
    this.feedbackState.set(correct ? 'correct' : 'incorrect');
    this.cardOffsetX.set(0);

    if (correct) {
      this.score.update(value => value + 1);
    }

    this.results.update(prev => {
      const next = [...prev];
      next[this.currentIndex()] = correct;
      return next;
    });

    this.analytics.track('swipe_quiz_answer', {
      quizId: this.quiz().id,
      statementId: statement.id,
      swipedRight,
      correct,
    });

    if (this.prefersReducedMotion) {
      window.setTimeout(() => this.advanceOrFinish(), FEEDBACK_DURATION);
      return;
    }

    window.setTimeout(() => {
      this.exitDirection.set(swipedRight ? 'right' : 'left');
      window.setTimeout(() => this.advanceOrFinish(), EXIT_DURATION);
    }, FEEDBACK_DURATION);
  }

  handleBack(): void {
    this.analytics.track('swipe_quiz_abandoned', {
      quizId: this.quiz().id,
      currentIdx: this.currentIndex(),
    });
    window.history.back();
  }

  handleActionPointerDown(event: PointerEvent): void {
    if (this.actionsDisabled()) return;
    if (this.prefersReducedMotion) return;
    const element = event.currentTarget as HTMLElement | null;
    if (!element) return;
    element.style.transform = 'scale(0.9)';
  }

  handleActionPointerUp(event: PointerEvent): void {
    if (this.prefersReducedMotion) return;
    const element = event.currentTarget as HTMLElement | null;
    if (!element) return;
    element.style.transform = 'scale(1)';
  }

  backgroundCardStyle(): Record<string, string> {
    const visible = this.hasNextCard();
    return {
      opacity: visible ? '0.5' : '0',
      transform: visible ? 'scale(0.92)' : 'scale(0.85)',
      transition: this.prefersReducedMotion
        ? 'none'
        : 'opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
    };
  }

  activeCardStyle(): Record<string, string> {
    if (this.enterAnim()) {
      return {
        opacity: '0',
        transform: 'scale(0.9)',
        transition: 'none',
      };
    }
    return {
      opacity: '1',
      transform: 'scale(1)',
      transition: this.prefersReducedMotion
        ? 'none'
        : 'opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
    };
  }

  cardStyle(): Record<string, string> {
    const exitDirection = this.exitDirection();
    const feedbackState = this.feedbackState();
    const offsetX = this.cardOffsetX();
    const rotation = offsetX * ROTATION_FACTOR;

    let translateX = offsetX;
    let translateY = 0;
    let opacity = 1;
    let scale = 1;
    let angle = rotation;

    if (exitDirection) {
      translateX = exitDirection === 'right' ? 500 : -500;
      translateY = 60;
      opacity = 0;
      angle = exitDirection === 'right' ? 20 : -20;
    }

    if (feedbackState && !exitDirection) {
      translateX = 0;
      scale = 0.98;
    }

    return {
      transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${angle}deg) scale(${scale})`,
      opacity: String(opacity),
      transition: this.prefersReducedMotion
        ? 'none'
        : this.isDragging()
        ? 'none'
        : exitDirection
          ? 'transform var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit), opacity var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit)'
          : 'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
      willChange: 'transform',
    };
  }

  cardBodyStyle(): Record<string, string> {
    const feedbackState = this.feedbackState();
    const trueOpacity = this.trueLabelOpacity();
    const falseOpacity = this.falseLabelOpacity();

    let borderColor = 'var(--c-lt-border)';
    if (feedbackState === 'correct') {
      borderColor = 'var(--f-brand-color-border-success)';
    } else if (feedbackState === 'incorrect') {
      borderColor = 'var(--f-brand-color-border-error)';
    } else if (trueOpacity > 0.3) {
      borderColor = 'var(--f-brand-color-border-success)';
    } else if (falseOpacity > 0.3) {
      borderColor = 'var(--f-brand-color-border-error)';
    }

    return {
      border: `var(--f-brand-border-size-default) solid ${borderColor}`,
      boxShadow: '0px 2px 4px 2px var(--f-brand-color-shadow-default)',
      transition: this.prefersReducedMotion
        ? 'none'
        : this.isDragging()
        ? 'border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), box-shadow var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)'
        : 'border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), box-shadow var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
    };
  }

  feedbackOverlayStyle(): Record<string, string> {
    const visible = this.isFeedbackVisible();
    return {
      opacity: visible ? '1' : '0',
      transform: this.prefersReducedMotion ? 'scale(1)' : visible ? 'scale(1)' : 'scale(0.85)',
      transition: this.prefersReducedMotion
        ? 'none'
        : 'opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
    };
  }

  feedbackIconStyle(): Record<string, string> {
    const correct = this.isFeedbackCorrect();
    return {
      background: correct ? 'var(--f-brand-color-background-success-accent)' : 'var(--f-brand-color-background-error)',
      border: `var(--f-brand-border-size-focused) solid ${
        correct ? 'var(--f-brand-color-border-success)' : 'var(--f-brand-color-border-error)'
      }`,
      boxShadow: correct ? 'var(--c-glow-success-xl)' : 'var(--c-glow-error-xl)',
    };
  }

  actionButtonStyle(direction: 'left' | 'right'): Record<string, string> {
    const disabled = this.actionsDisabled();
    const isTrueButton = direction === 'right';
    return {
      width: 'calc(var(--sp-14) + var(--sp-1))',
      minHeight: 'calc(var(--sp-14) + var(--sp-1))',
      borderRadius: '50%',
      border: `var(--f-brand-border-size-focused) solid ${
        isTrueButton ? 'var(--f-brand-color-border-success)' : 'var(--f-brand-color-border-error)'
      }`,
      background: isTrueButton ? 'var(--f-brand-color-background-success-accent)' : 'var(--f-brand-color-background-error)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? '0.4' : '1',
      transition: this.prefersReducedMotion
        ? 'none'
        : 'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), box-shadow var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
      boxShadow: 'none',
    };
  }

  private advanceOrFinish(): void {
    const isLast = this.currentIndex() >= this.totalStatements() - 1;
    if (isLast) {
      const finalScore = this.score();
      const total = this.totalStatements();
      const quiz = this.quiz();
      this.store.addPoints(finalScore);
      this.store.recordQuizResult(quiz.id, finalScore, total);
      if (this.isFlowId(quiz.id)) {
        this.store.completeFlow(quiz.id);
      }
      this.analytics.track('swipe_quiz_completed', {
        quizId: quiz.id,
        score: finalScore,
        total,
      });
      void this.router.navigate(['/results'], {
        state: { score: finalScore, total, quizTitle: quiz.title },
      });
      return;
    }

    this.currentIndex.update(value => value + 1);
    this.feedbackState.set(null);
    this.exitDirection.set(null);
    this.cardOffsetX.set(0);
    this.isTransitioning.set(false);
    this.triggerEnterAnimation();
  }

  private triggerEnterAnimation(): void {
    if (this.prefersReducedMotion) {
      this.enterAnim.set(false);
      return;
    }
    this.enterAnim.set(true);
    requestAnimationFrame(() => this.enterAnim.set(false));
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
