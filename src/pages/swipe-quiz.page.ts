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
  imports: [CommonModule],
  template: `
    <main
      data-page="swipe-quiz"
      style="
        min-height: 100dvh;
        display: flex;
        justify-content: center;
        background: var(--c-bg);
        color: var(--c-text-1);
      "
    >
      <section
        class="page-in"
        style="
          width: 100%;
          max-width: 420px;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
        "
      >
        <header style="padding: var(--sp-4); flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: var(--sp-3);">
            <button
              class="f-button f-button--ghost"
              type="button"
              data-ui="back-btn"
              aria-label="Go back"
              (click)="handleBack()"
              style="
                width: var(--sp-11);
                min-height: var(--sp-11);
                padding: 0;
                border-radius: var(--r-full);
                color: var(--c-text-1);
              "
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>

            <div style="flex: 1; text-align: center;">
              <span
                style="
                  font: var(--f-brand-type-headline-medium);
                  font-size: var(--text-md);
                  color: var(--c-text-1);
                  letter-spacing: var(--tracking-snug);
                "
              >
                {{ quiz().title }}
              </span>
            </div>

            <div
              style="
                min-width: var(--sp-10);
                min-height: var(--sp-7);
                border-radius: var(--f-brand-radius-rounded);
                background: var(--f-brand-color-background-light);
                border: var(--f-brand-border-size-default) solid var(--f-brand-color-border-default);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0 var(--sp-1);
                gap: var(--sp-1);
              "
            >
              <span
                style="
                  font: var(--f-brand-type-caption-medium);
                  font-size: var(--text-xs);
                  font-weight: var(--weight-bold);
                  color: var(--f-brand-color-accent);
                "
              >
                {{ score() }}
              </span>
              <span
                style="
                  font: var(--f-brand-type-caption);
                  font-size: var(--text-2xs);
                  color: var(--f-brand-color-text-muted);
                "
              >
                /{{ totalStatements() }}
              </span>
            </div>
          </div>
        </header>

        <div style="padding: 0 var(--sp-4) var(--sp-4); flex-shrink: 0;">
          <div style="display: flex; align-items: center; justify-content: center; gap: var(--sp-1); flex-wrap: wrap;">
            @for (entry of resultDots(); track $index; let i = $index) {
              <span
                [ngStyle]="dotStyle(i, entry)"
                style="
                  display: inline-block;
                  min-height: var(--sp-2);
                  border-radius: var(--f-brand-radius-rounded);
                "
              ></span>
            }
          </div>
        </div>

        <div
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
            style="
              position: absolute;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: var(--sp-4);
              z-index: 1;
            "
          >
            <div
              [ngStyle]="backgroundCardStyle()"
              style="
                width: 100%;
                max-width: calc(var(--sp-20) * 4 + var(--sp-5));
                aspect-ratio: 3 / 4;
                border-radius: var(--f-brand-radius-outer);
                background: var(--f-brand-color-background-light);
                border: 1.5px solid var(--f-brand-color-border-default);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
              "
            ></div>
          </div>

          <div
            [ngStyle]="activeCardStyle()"
            style="
              position: absolute;
              inset: 0;
              z-index: 2;
            "
          >
            <article
              [ngStyle]="cardStyle()"
              style="
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: var(--sp-4);
                z-index: 5;
              "
            >
              <div
                [ngStyle]="cardBodyStyle()"
                style="
                  position: relative;
                  width: 100%;
                  max-width: calc(var(--sp-20) * 4 + var(--sp-5));
                  aspect-ratio: 3 / 4;
                  border-radius: var(--f-brand-radius-outer);
                  background: var(--f-brand-color-background-light);
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  padding: var(--sp-8);
                  text-align: center;
                  overflow: hidden;
                "
              >
                <div
                  [style.background]="currentStatement().accentColor"
                  style="
                    position: absolute;
                    top: calc(var(--sp-16) * -1 + var(--sp-1));
                    left: 50%;
                    transform: translateX(-50%);
                    width: calc(var(--sp-20) * 2 + var(--sp-10));
                    min-height: calc(var(--sp-20) * 2 + var(--sp-10));
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.4;
                    pointer-events: none;
                  "
                ></div>

                <span
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
                    font-weight: var(--weight-bold);
                    letter-spacing: var(--tracking-wide);
                    text-transform: uppercase;
                    transform: rotate(-12deg);
                    transition: opacity var(--f-brand-motion-duration-fast, 100ms) var(--f-brand-motion-easing-default);
                    pointer-events: none;
                    z-index: 10;
                  "
                >
                  {{ labels().right }}
                </span>
                <span
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
                    font-weight: var(--weight-bold);
                    letter-spacing: var(--tracking-wide);
                    text-transform: uppercase;
                    transform: rotate(12deg);
                    transition: opacity var(--f-brand-motion-duration-fast, 100ms) var(--f-brand-motion-easing-default);
                    pointer-events: none;
                    z-index: 10;
                  "
                >
                  {{ labels().left }}
                </span>

                <div
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
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M5 13l4 4L19 7"
                          stroke="var(--f-brand-color-border-success)"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    } @else {
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
                    [style.color]="isFeedbackCorrect() ? 'var(--f-brand-color-border-success)' : 'var(--f-brand-color-status-error)'"
                    style="
                      font: var(--f-brand-type-title-3);
                      font-size: var(--text-xl);
                      font-weight: var(--weight-bold);
                      letter-spacing: var(--tracking-wide);
                    "
                  >
                    {{ isFeedbackCorrect() ? 'Correct!' : 'Wrong!' }}
                  </span>
                  <span
                    style="
                      font: var(--f-brand-type-caption);
                      font-size: var(--text-sm);
                      color: var(--f-brand-color-text-subtle);
                      text-align: center;
                      line-height: var(--leading-snug);
                      max-width: calc(var(--sp-20) * 3 + var(--sp-5));
                    "
                  >
                    {{ currentStatement().explanation }}
                  </span>
                </div>

                <div
                  [style.opacity]="isFeedbackVisible() ? '0' : '1'"
                  style="
                    font: var(--f-brand-type-title-3);
                    color: var(--f-brand-color-text-default);
                    line-height: var(--leading-tight);
                    letter-spacing: var(--tracking-tight);
                    text-align: center;
                    transition: opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
                    z-index: 1;
                  "
                >
                  {{ currentStatement().statement }}
                </div>

                <div
                  [style.opacity]="isFeedbackVisible() ? '0' : '0.6'"
                  style="
                    position: absolute;
                    bottom: var(--sp-6);
                    font: var(--f-brand-type-caption);
                    font-size: var(--text-xs);
                    color: var(--f-brand-color-text-muted);
                    letter-spacing: var(--tracking-wide);
                    text-transform: uppercase;
                    transition: opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
                  "
                >
                  Swipe to answer
                </div>
              </div>
            </article>
          </div>
        </div>

        <div
          style="
            display: flex;
            justify-content: space-between;
            padding: 0 var(--sp-8);
            flex-shrink: 0;
          "
        >
          <span
            style="
              font: var(--f-brand-type-caption-medium);
              font-size: var(--text-xs);
              color: var(--f-brand-color-status-error);
              letter-spacing: var(--tracking-wide);
              text-transform: uppercase;
              opacity: 0.6;
            "
          >
            {{ labels().left }}
          </span>
          <span
            style="
              font: var(--f-brand-type-caption-medium);
              font-size: var(--text-xs);
              color: var(--f-brand-color-border-success);
              letter-spacing: var(--tracking-wide);
              text-transform: uppercase;
              opacity: 0.6;
            "
          >
            {{ labels().right }}
          </span>
        </div>

        <div style="padding: var(--sp-4) var(--sp-4) var(--sp-8); flex-shrink: 0;">
          <div style="display: flex; align-items: center; justify-content: center; gap: var(--sp-10);">
            <button
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
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
  `,
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
  readonly resultDots = computed(() => this.results());
  readonly hasNextCard = computed(() => this.currentIndex() < this.totalStatements() - 1);
  readonly isFeedbackVisible = computed(() => this.feedbackState() !== null);
  readonly isFeedbackCorrect = computed(() => this.feedbackState() === 'correct');
  readonly actionsDisabled = computed(() => this.isTransitioning() || this.feedbackState() !== null);
  readonly trueLabelOpacity = computed(() => Math.min(Math.max(this.cardOffsetX() / SWIPE_THRESHOLD, 0), 1));
  readonly falseLabelOpacity = computed(() => Math.min(Math.max(-this.cardOffsetX() / SWIPE_THRESHOLD, 0), 1));

  private dragStartX = 0;

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
    const element = event.currentTarget as HTMLElement | null;
    if (!element) return;
    element.style.transform = 'scale(0.9)';
  }

  handleActionPointerUp(event: PointerEvent): void {
    const element = event.currentTarget as HTMLElement | null;
    if (!element) return;
    element.style.transform = 'scale(1)';
  }

  dotStyle(index: number, result: boolean | null): Record<string, string> {
    const isCurrent = index === this.currentIndex();
    if (result === true) {
      return {
        width: 'var(--sp-6)',
        background: 'var(--f-brand-color-border-success)',
        boxShadow: '0 0 8px var(--f-brand-color-border-success)',
      };
    }
    if (result === false) {
      return {
        width: 'var(--sp-6)',
        background: 'var(--f-brand-color-status-error)',
        boxShadow: '0 0 8px var(--f-brand-color-border-error)',
      };
    }
    return {
      width: isCurrent ? 'var(--sp-6)' : 'var(--sp-2)',
      background: isCurrent ? 'var(--f-brand-color-text-default)' : 'var(--f-brand-color-background-light)',
      transition: 'all var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
      boxShadow: 'none',
    };
  }

  backgroundCardStyle(): Record<string, string> {
    const visible = this.hasNextCard();
    return {
      opacity: visible ? '0.5' : '0',
      transform: visible ? 'scale(0.92)' : 'scale(0.85)',
      transition:
        'opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
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
      transition:
        'opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
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
      transition: this.isDragging()
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

    let borderColor = 'var(--f-brand-color-border-default)';
    if (feedbackState === 'correct') {
      borderColor = 'var(--f-brand-color-border-success)';
    } else if (feedbackState === 'incorrect') {
      borderColor = 'var(--f-brand-color-border-error)';
    } else if (trueOpacity > 0.3) {
      borderColor = 'var(--f-brand-color-border-success)';
    } else if (falseOpacity > 0.3) {
      borderColor = 'var(--f-brand-color-border-error)';
    }

    const boxShadow = feedbackState === 'correct'
      ? '0 0 60px var(--f-brand-color-border-success), var(--f-brand-shadow-large)'
      : feedbackState === 'incorrect'
        ? '0 0 60px var(--f-brand-color-border-error), var(--f-brand-shadow-large)'
        : 'var(--f-brand-shadow-large)';

    return {
      border: `1.5px solid ${borderColor}`,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow,
      transition: this.isDragging()
        ? 'border-color var(--f-brand-motion-duration-fast, 100ms) var(--f-brand-motion-easing-default), box-shadow var(--f-brand-motion-duration-fast, 100ms) var(--f-brand-motion-easing-default)'
        : 'border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), box-shadow var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
    };
  }

  feedbackOverlayStyle(): Record<string, string> {
    const visible = this.isFeedbackVisible();
    return {
      opacity: visible ? '1' : '0',
      transform: visible ? 'scale(1)' : 'scale(0.85)',
      transition:
        'opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
    };
  }

  feedbackIconStyle(): Record<string, string> {
    const correct = this.isFeedbackCorrect();
    return {
      background: correct ? 'var(--f-brand-color-background-success-accent)' : 'var(--f-brand-color-background-error)',
      border: `2px solid ${correct ? 'var(--f-brand-color-border-success)' : 'var(--f-brand-color-border-error)'}`,
      boxShadow: `0 0 40px ${correct ? 'var(--f-brand-color-border-success)' : 'var(--f-brand-color-border-error)'}`,
    };
  }

  actionButtonStyle(direction: 'left' | 'right'): Record<string, string> {
    const disabled = this.actionsDisabled();
    const isTrueButton = direction === 'right';
    return {
      width: 'calc(var(--sp-14) + var(--sp-1))',
      minHeight: 'calc(var(--sp-14) + var(--sp-1))',
      borderRadius: '50%',
      border: `2px solid ${isTrueButton ? 'var(--f-brand-color-border-success)' : 'var(--f-brand-color-border-error)'}`,
      background: isTrueButton ? 'var(--f-brand-color-background-success-accent)' : 'var(--f-brand-color-background-error)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? '0.4' : '1',
      transition:
        'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), box-shadow var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
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
