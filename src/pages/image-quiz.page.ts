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

import { ScreenComponent } from '../components/screen/screen.component';
import { IMAGE_QUIZZES, type ImageQuestion, type ImageQuiz } from '../data/imageQuizzes';
import { FLOW_IDS, type FlowId } from '../models/flow-id.model';
import { AnalyticsService } from '../services/analytics.service';
import { StoreService } from '../services/store.service';

const QUESTION_TIME = 15;
const SLIDE_TRANSITION =
  'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)';
const SLIDE_EXIT_MS = 250;
const CHEVRON_LEFT_WHITE_ICON = new URL('../assets/icons/Chevron-left-white.svg', import.meta.url).href;

@Component({
  standalone: true,
  imports: [CommonModule, ScreenComponent],
  template: `
    <app-screen className="f-page-enter image-quiz-screen">
      <section data-page="image-quiz" class="image-quiz-page">
        <header data-section="header" class="image-quiz-header">
          <div class="image-quiz-header-row">
            <button
              type="button"
              class="f-button f-button--ghost image-quiz-back-btn"
              data-ui="back-btn"
              aria-label="Go back"
              (click)="handleBack()"
            >
              <img
                [src]="chevronLeftWhiteIcon"
                alt=""
                aria-hidden="true"
                class="image-quiz-back-icon"
              />
            </button>

            <div class="image-quiz-progress-track">
              <div class="image-quiz-progress-fill" [style.width.%]="progressPercent()"></div>
            </div>

            <span class="image-quiz-question-counter">{{ questionIndex() + 1 }}/{{ totalQuestions() }}</span>
          </div>
        </header>

        <div [ngStyle]="slideStyle()" class="image-quiz-content-animated">
          <div data-section="timer" class="image-quiz-timer-section">
            <div class="image-quiz-timer-wrapper">
              <svg
                class="image-quiz-timer-svg"
                [attr.width]="timerSize"
                [attr.height]="timerSize"
                aria-hidden="true"
              >
                <circle
                  [attr.cx]="timerCenter"
                  [attr.cy]="timerCenter"
                  [attr.r]="timerRadius"
                  fill="none"
                  stroke="var(--c-surface-raise)"
                  [attr.stroke-width]="timerStroke"
                />
                <circle
                  [attr.cx]="timerCenter"
                  [attr.cy]="timerCenter"
                  [attr.r]="timerRadius"
                  fill="none"
                  stroke="var(--f-brand-color-text-light)"
                  [attr.stroke-width]="timerStroke"
                  [attr.stroke-dasharray]="timerCircumference"
                  [attr.stroke-dashoffset]="timerOffset()"
                  stroke-linecap="round"
                  class="image-quiz-timer-fill"
                />
              </svg>
              <div class="image-quiz-timer-label">{{ timeLeft() }}</div>
            </div>
          </div>

          <h1 data-section="question" class="image-quiz-question-text">{{ currentQuestion().question }}</h1>

          <div data-section="image-grid" class="image-quiz-options-grid">
            @for (option of currentQuestion().options; track option.id) {
              <button
                type="button"
                class="image-quiz-option-button"
                [ngStyle]="optionButtonStyle(option.id)"
                [disabled]="revealed()"
                [attr.aria-label]="option.label"
                (click)="handleSelect(option.id)"
              >
                <img
                  class="image-quiz-option-image"
                  [src]="option.imageUrl"
                  [alt]="option.label"
                  (load)="markImageLoaded(option.id)"
                  [style.opacity]="isImageLoaded(option.id) ? '1' : '0'"
                />

                @if (!isImageLoaded(option.id)) {
                  <div class="image-quiz-option-placeholder">
                    <span class="image-quiz-option-spinner" aria-hidden="true"></span>
                  </div>
                }

                @if (showOverlay(option.id)) {
                  <div class="image-quiz-option-overlay" [ngStyle]="overlayStyle(option.id)">
                    @if (option.id === currentQuestion().correctId) {
                      <svg
                        class="image-quiz-feedback-icon"
                        viewBox="0 0 40 40"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M10 20L17 27L30 13"
                          stroke="currentColor"
                          stroke-width="3.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    } @else {
                      <svg
                        class="image-quiz-feedback-icon"
                        viewBox="0 0 40 40"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 12L28 28M28 12L12 28"
                          stroke="currentColor"
                          stroke-width="3.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    }
                  </div>
                }

                <div class="image-quiz-option-label-wrapper">
                  <span class="image-quiz-option-label">{{ option.label }}</span>
                </div>
              </button>
            }
          </div>
        </div>

        <footer class="image-quiz-footer">
          @if (revealed()) {
            <p class="image-quiz-feedback-message" [style.color]="feedbackColor()">
              {{ feedbackText() }}
            </p>
          }
          <button
            type="button"
            class="image-quiz-next-btn"
            data-ui="next-btn"
            [disabled]="!revealed()"
            [ngStyle]="nextButtonStyle()"
            (click)="handleNext()"
          >
            {{ nextLabel() }}
          </button>
        </footer>
      </section>
    </app-screen>
  `,
  styles: [
    `
      .image-quiz-screen {
        background: var(--c-bg);
      }

      .image-quiz-page {
        display: flex;
        flex-direction: column;
        min-height: 100%;
        max-width: 420px;
        width: 100%;
        margin: 0 auto;
      }

      .image-quiz-header {
        padding: var(--sp-4);
        flex-shrink: 0;
      }

      .image-quiz-header-row {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
      }

      .image-quiz-back-btn {
        width: var(--sp-11);
        min-height: var(--sp-11);
        padding: 0;
        border-radius: var(--r-full);
        flex-shrink: 0;
      }

      .image-quiz-back-icon {
        width: var(--sp-6);
        height: var(--sp-6);
      }

      .image-quiz-progress-track {
        flex: 1;
        height: var(--sp-1);
        background: var(--f-brand-color-background-light);
        border-radius: var(--f-brand-radius-rounded);
        overflow: hidden;
      }

      .image-quiz-progress-fill {
        height: 100%;
        background: var(--f-brand-color-accent);
        border-radius: var(--f-brand-radius-rounded);
        transition: width var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
      }

      .image-quiz-question-counter {
        flex-shrink: 0;
        color: var(--c-text-2);
        font: var(--f-brand-type-caption);
        font-size: var(--text-xs);
      }

      .image-quiz-content-animated {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .image-quiz-timer-section {
        display: flex;
        justify-content: center;
        margin-bottom: var(--sp-4);
        flex-shrink: 0;
      }

      .image-quiz-timer-wrapper {
        position: relative;
        width: var(--sp-16);
        height: var(--sp-16);
        flex-shrink: 0;
      }

      .image-quiz-timer-svg {
        transform: rotate(-90deg);
      }

      .image-quiz-timer-fill {
        transition: stroke-dashoffset 1s linear;
      }

      .image-quiz-timer-label {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--f-brand-color-text-light);
        font: var(--f-brand-type-subheading-medium);
      }

      .image-quiz-question-text {
        margin: 0;
        padding: 0 var(--sp-6);
        color: var(--f-brand-color-text-light);
        font: var(--f-brand-type-title-3);
        font-size: var(--text-xl);
        line-height: var(--leading-tight);
        letter-spacing: var(--tracking-tight);
        text-align: center;
        margin-bottom: var(--sp-6);
        flex-shrink: 0;
      }

      .image-quiz-options-grid {
        padding: 0 var(--sp-4);
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--sp-3);
        flex: 1;
      }

      .image-quiz-option-button {
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        border-radius: var(--f-brand-radius-inner);
        border: var(--f-brand-border-size-focused) solid var(--f-brand-color-border-default);
        background: var(--f-brand-color-background-light);
        overflow: hidden;
        cursor: pointer;
        padding: 0;
        font-family: inherit;
        transition:
          border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default),
          transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
        -webkit-tap-highlight-color: transparent;
      }

      .image-quiz-option-button:disabled {
        cursor: default;
      }

      .image-quiz-option-image {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
      }

      .image-quiz-option-placeholder {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--f-brand-color-background-light);
      }

      .image-quiz-option-spinner {
        width: var(--sp-6);
        height: var(--sp-6);
        border-radius: var(--r-full);
        border: var(--f-brand-border-size-focused) solid var(--c-surface-raise);
        border-top-color: var(--f-brand-color-accent);
        animation: quiz-spin var(--f-brand-motion-duration-quick) linear infinite;
      }

      .image-quiz-option-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--f-brand-color-text-light);
        transition: opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
        z-index: 2;
      }

      .image-quiz-feedback-icon {
        width: var(--sp-10);
        height: var(--sp-10);
      }

      .image-quiz-option-label-wrapper {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        padding: var(--sp-4) var(--sp-2) var(--sp-2);
        background: var(--f-brand-fill-gradient-overlay-vertical);
        z-index: 1;
      }

      .image-quiz-option-label {
        color: var(--f-brand-color-text-light);
        font: var(--f-brand-type-caption-medium);
        font-size: var(--text-sm);
      }

      .image-quiz-footer {
        padding: var(--sp-4) var(--sp-4) var(--sp-8);
        flex-shrink: 0;
      }

      .image-quiz-feedback-message {
        margin: 0 0 var(--sp-3);
        text-align: center;
        font: var(--f-brand-type-subheading-medium);
        font-size: var(--text-sm);
        letter-spacing: var(--tracking-wide);
      }

      .image-quiz-next-btn {
        width: 100%;
        min-height: var(--sp-11);
        border-radius: var(--f-brand-radius-rounded);
        border: none;
        font: var(--f-brand-type-body-medium);
        font-size: var(--text-md);
        transition:
          background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit),
          color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit);
      }

      .image-quiz-next-btn:disabled {
        cursor: default;
      }

      @media (prefers-reduced-motion: reduce) {
        .image-quiz-progress-fill,
        .image-quiz-timer-fill,
        .image-quiz-option-button,
        .image-quiz-option-image,
        .image-quiz-option-overlay,
        .image-quiz-next-btn {
          transition: none;
        }

        .image-quiz-option-spinner {
          animation: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageQuizPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(StoreService);
  private readonly analytics = inject(AnalyticsService);

  readonly chevronLeftWhiteIcon = CHEVRON_LEFT_WHITE_ICON;

  readonly quiz = signal<ImageQuiz>(IMAGE_QUIZZES[0]);
  readonly questionIndex = signal(0);
  readonly score = signal(0);
  readonly chosenId = signal<string | null>(null);
  readonly revealed = signal(false);
  readonly timeLeft = signal(QUESTION_TIME);
  readonly imageLoadState = signal<Record<string, boolean>>({});
  readonly slideStyle = signal<Record<string, string>>({
    transform: 'translateX(0)',
    opacity: '1',
    transition: SLIDE_TRANSITION,
  });

  readonly totalQuestions = computed(() => this.quiz().questions.length);
  readonly currentQuestion = computed<ImageQuestion>(
    () => this.quiz().questions[this.questionIndex()] ?? this.quiz().questions[0]
  );
  readonly isLastQuestion = computed(() => this.questionIndex() >= this.totalQuestions() - 1);
  readonly progressPercent = computed(() => {
    const completed = this.questionIndex() + (this.revealed() ? 1 : 0);
    return (completed / this.totalQuestions()) * 100;
  });

  readonly timerSize = 64;
  readonly timerStroke = 3;
  readonly timerCenter = this.timerSize / 2;
  readonly timerRadius = (this.timerSize - 8) / 2;
  readonly timerCircumference = 2 * Math.PI * this.timerRadius;
  readonly timerOffset = computed(() => {
    const progress = 1 - this.timeLeft() / QUESTION_TIME;
    return this.timerCircumference * progress;
  });

  private readonly prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  private timerId: number | null = null;
  private slideEnterFrameId: number | null = null;
  private slideExitTimeoutId: number | null = null;
  private isAnimating = false;

  ngOnInit(): void {
    const routeQuizId = this.route.snapshot.paramMap.get('quizId');
    const stateQuizId = this.readStateString('quizId');
    const requestedQuizId = routeQuizId ?? stateQuizId;
    const resolvedQuiz = IMAGE_QUIZZES.find(entry => entry.id === requestedQuizId) ?? IMAGE_QUIZZES[0];

    this.quiz.set(resolvedQuiz);
    this.analytics.track('quiz_viewed', { quizId: resolvedQuiz.id });
    this.startTimer();
    this.triggerSlideIn();
  }

  ngOnDestroy(): void {
    this.stopTimer();
    if (this.slideEnterFrameId !== null) {
      window.cancelAnimationFrame(this.slideEnterFrameId);
    }
    if (this.slideExitTimeoutId !== null) {
      window.clearTimeout(this.slideExitTimeoutId);
    }
  }

  handleSelect(optionId: string): void {
    if (this.revealed()) return;
    this.stopTimer();
    this.chosenId.set(optionId);
    this.revealed.set(true);
    const isCorrect = optionId === this.currentQuestion().correctId;
    if (isCorrect) {
      this.score.update(value => value + 1);
    }
    this.analytics.track('quiz_answer', {
      quizId: this.quiz().id,
      qIdx: this.questionIndex(),
      correct: isCorrect,
    });
  }

  handleNext(): void {
    if (this.isAnimating || !this.revealed()) return;
    if (this.isLastQuestion()) {
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

  markImageLoaded(optionId: string): void {
    const key = this.imageKey(optionId);
    this.imageLoadState.update(previous => ({ ...previous, [key]: true }));
  }

  isImageLoaded(optionId: string): boolean {
    return this.imageLoadState()[this.imageKey(optionId)] === true;
  }

  showOverlay(optionId: string): boolean {
    if (!this.revealed()) return false;
    const isChosen = this.chosenId() === optionId;
    const isCorrect = this.currentQuestion().correctId === optionId;
    return isChosen || isCorrect;
  }

  optionButtonStyle(optionId: string): Record<string, string> {
    const correctId = this.currentQuestion().correctId;
    const isChosen = this.chosenId() === optionId;
    const isCorrect = optionId === correctId;

    let borderColor = 'var(--f-brand-color-border-default)';
    if (this.revealed() && isCorrect) {
      borderColor = 'var(--f-brand-color-border-success)';
    } else if (this.revealed() && isChosen && !isCorrect) {
      borderColor = 'var(--f-brand-color-status-error)';
    } else if (!this.revealed() && isChosen) {
      borderColor = 'var(--f-brand-color-accent)';
    }

    return {
      borderColor,
      cursor: this.revealed() ? 'default' : 'pointer',
    };
  }

  overlayStyle(optionId: string): Record<string, string> {
    return {
      background:
        optionId === this.currentQuestion().correctId ? 'var(--c-correct-glow)' : 'var(--c-error-glow)',
    };
  }

  feedbackText(): string {
    const selected = this.chosenId();
    if (selected === this.currentQuestion().correctId) {
      return '✓ Correct! +1 point';
    }
    if (selected) {
      return '✗ Incorrect';
    }
    return "⏱ Time's up!";
  }

  feedbackColor(): string {
    return this.chosenId() === this.currentQuestion().correctId
      ? 'var(--f-brand-color-border-success)'
      : 'var(--f-brand-color-status-error)';
  }

  nextButtonStyle(): Record<string, string> {
    return {
      background: this.revealed()
        ? 'var(--f-brand-color-text-light)'
        : 'var(--f-brand-color-background-light)',
      color: this.revealed() ? 'var(--f-brand-color-primary)' : 'var(--f-brand-color-text-muted)',
      cursor: this.revealed() ? 'pointer' : 'default',
    };
  }

  nextLabel(): string {
    if (this.isLastQuestion() && this.revealed()) {
      return `Finish · ${this.score()}/${this.totalQuestions()}`;
    }
    return 'Next';
  }

  private advanceToNextQuestion(): void {
    this.questionIndex.update(value => value + 1);
    this.chosenId.set(null);
    this.revealed.set(false);
    this.timeLeft.set(QUESTION_TIME);
    this.startTimer();
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
      const nextValue = this.timeLeft() - 1;
      this.timeLeft.set(Math.max(nextValue, 0));
      if (nextValue <= 0) {
        this.stopTimer();
        this.revealed.set(true);
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

  private finishQuiz(): void {
    this.stopTimer();
    const finalScore = this.score();
    const total = this.totalQuestions();
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

  private isFlowId(value: string): value is FlowId {
    return (FLOW_IDS as readonly string[]).includes(value);
  }

  private imageKey(optionId: string): string {
    return `${this.currentQuestion().id}:${optionId}`;
  }

  private readStateString(key: string): string | null {
    const state = window.history.state as Record<string, unknown> | null;
    const value = state?.[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
