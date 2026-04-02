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

import { QUIZZES, type Quiz, type QuizQuestion } from '../data/quizzes';
import { FLOW_IDS, type FlowId } from '../models/flow-id.model';
import { AnalyticsService } from '../services/analytics.service';
import { StoreService } from '../services/store.service';

const QUESTION_TIME = 15;
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const SLIDE_TRANSITION =
  'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)';
const TICK_WHITE_ICON = 'assets/icons/Tick-white.svg';
const CLOSE_WHITE_ICON = 'assets/icons/Close-white.svg';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <main
      data-page="quiz"
      style="
        min-height: 100dvh;
        background: var(--c-lt-bg);
        color: var(--c-lt-text-1);
        display: flex;
        justify-content: center;
      "
    >
      <section
        style="
          width: 100%;
          max-width: 420px;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
        "
      >
        <header
          style="
            display: flex;
            align-items: center;
            gap: var(--sp-4);
            padding: var(--sp-18) var(--sp-4) 0;
          "
        >
          <button
            type="button"
            data-ui="back-btn"
            aria-label="Close quiz"
            (click)="handleBack()"
            style="
              width: var(--sp-12);
              min-width: var(--sp-12);
              min-height: var(--sp-12);
              border-radius: var(--r-full);
              border: var(--f-brand-border-size-default) solid var(--c-lt-surface);
              background: var(--c-lt-surface);
              box-shadow: 0px 2px 4px 0px var(--f-brand-color-shadow-default);
              cursor: pointer;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            "
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="var(--c-lt-text-1)"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <div
            style="
              flex: 1;
              height: var(--sp-2);
              border-radius: var(--r-full);
              background: var(--c-lt-surface);
              overflow: hidden;
            "
          >
            <div
              [style.width.%]="progressPercent()"
              style="
                height: 100%;
                border-radius: var(--r-full);
                background: var(--f-brand-color-flight-status-confirmed);
                transition: width var(--f-brand-motion-duration-instant)
                  var(--f-brand-motion-easing-default);
              "
            ></div>
          </div>
        </header>

        <div
          [ngStyle]="slideStyle()"
          style="
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          "
        >
          <div
            style="
              margin: var(--sp-5) var(--sp-4) 0;
              height: 196px;
              border-radius: var(--f-brand-radius-inner);
              overflow: hidden;
              flex-shrink: 0;
              display: flex;
              align-items: center;
              justify-content: center;
            "
            [style.background]="currentQuestion().accentColor"
          >
            @if (quiz().bannerImage) {
              <img
                [src]="quiz().bannerImage"
                alt=""
                aria-hidden="true"
                style="
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                  transform: scaleX(-1);
                "
              />
            } @else {
              <span style="font-size: var(--text-5xl)">
                {{ quiz().emoji }}
              </span>
            }
          </div>

          <p
            style="
              margin: 0;
              padding: var(--sp-6) var(--sp-4) 0;
              text-align: center;
              font: var(--f-brand-type-title-5);
              color: var(--c-lt-text-1);
              flex-shrink: 0;
            "
          >
            {{ currentQuestion().question }}
          </p>

          <div
            style="
              padding: var(--sp-6) var(--sp-4) 0;
              display: flex;
              flex-direction: column;
              gap: var(--sp-4);
              flex-shrink: 0;
            "
          >
            @for (opt of currentQuestion().options; track opt.id; let idx = $index) {
              <button
                type="button"
                data-ui="answer-option-btn"
                [disabled]="revealed()"
                (click)="handleSelect(opt.id)"
                [ngStyle]="optionStyle(opt.id)"
              >
                <span
                  [ngStyle]="optionBadgeStyle(opt.id)"
                  style="
                    width: var(--sp-10);
                    min-width: var(--sp-10);
                    height: var(--sp-10);
                    border-radius: var(--r-full);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font: var(--f-brand-type-body);
                    flex-shrink: 0;
                    transition: background var(--f-brand-motion-duration-instant)
                        var(--f-brand-motion-easing-default),
                      color var(--f-brand-motion-duration-instant)
                        var(--f-brand-motion-easing-default);
                  "
                >
                  @if (showCorrectIcon(opt.id)) {
                    <img
                      [src]="tickWhiteIcon"
                      alt=""
                      aria-hidden="true"
                      style="width: var(--sp-6); height: var(--sp-6); display: block"
                    />
                  } @else if (showWrongIcon(opt.id)) {
                    <img
                      [src]="closeWhiteIcon"
                      alt=""
                      aria-hidden="true"
                      style="width: var(--sp-6); height: var(--sp-6); display: block"
                    />
                  } @else {
                    {{ optionLetter(idx) }}
                  }
                </span>
                <span
                  style="
                    flex: 1;
                    text-align: left;
                    font: var(--f-brand-type-body);
                    color: inherit;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    transition: color var(--f-brand-motion-duration-instant)
                      var(--f-brand-motion-easing-default);
                  "
                >
                  {{ opt.label }}
                </span>
              </button>
            }
          </div>
        </div>

        <div style="padding: 0 var(--sp-4) var(--sp-10); flex-shrink: 0">
          <div
            style="
              display: flex;
              justify-content: center;
              margin: var(--sp-6) 0 var(--sp-4);
            "
          >
            <div style="position: relative; width: var(--sp-16); height: var(--sp-16); flex-shrink: 0">
              <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true" style="transform: rotate(-90deg)">
                <defs>
                  <linearGradient [attr.id]="timerGradientId" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="var(--f-brand-color-background-accent)" />
                    <stop offset="100%" stop-color="var(--f-brand-color-background-accent-muted)" />
                  </linearGradient>
                </defs>
                <circle cx="32" cy="32" r="30" fill="none" stroke="var(--c-lt-border)" stroke-width="4"></circle>
                <circle
                  cx="32"
                  cy="32"
                  r="30"
                  fill="none"
                  [attr.stroke]="timerStroke()"
                  stroke-width="4"
                  [attr.stroke-dasharray]="timerCircumference"
                  [attr.stroke-dashoffset]="timerOffset()"
                  stroke-linecap="round"
                  style="
                    transition: stroke-dashoffset 1s linear,
                      stroke var(--f-brand-motion-duration-instant);
                  "
                ></circle>
              </svg>
              <span
                [style.color]="timeLeft() <= 5 ? 'var(--c-error)' : 'var(--c-lt-text-1)'"
                style="
                  position: absolute;
                  inset: 0;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font: var(--f-brand-type-headline-medium);
                  transition: color var(--f-brand-motion-duration-instant);
                "
              >
                {{ timerLabel() }}
              </span>
            </div>
          </div>

          @if (revealed()) {
            <p
              [style.color]="feedbackColor()"
              style="
                margin: 0 0 var(--sp-3);
                text-align: center;
                font: var(--f-brand-type-subheading-medium);
              "
            >
              {{ feedbackText() }}
            </p>
          }
          <button
            type="button"
            data-ui="next-question-btn"
            (click)="handleNext()"
            [ngStyle]="nextButtonStyle()"
          >
            {{ nextLabel() }}
          </button>
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      @media (prefers-reduced-motion: reduce) {
        [data-page='quiz'],
        [data-page='quiz'] * {
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
export class QuizPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(StoreService);
  private readonly analytics = inject(AnalyticsService);

  readonly quiz = signal<Quiz>(QUIZZES[0]);
  readonly questionIndex = signal(0);
  readonly score = signal(0);
  readonly selectedOptionId = signal<string | null>(null);
  readonly revealed = signal(false);
  readonly timeLeft = signal(QUESTION_TIME);
  readonly slideStyle = signal<Record<string, string>>({
    transform: 'translateX(0)',
    opacity: '1',
    transition: SLIDE_TRANSITION,
  });
  readonly tickWhiteIcon = TICK_WHITE_ICON;
  readonly closeWhiteIcon = CLOSE_WHITE_ICON;
  readonly timerGradientId = 'quiz-timer-gradient';

  readonly totalQuestions = computed(() => this.quiz().questions.length);
  readonly currentQuestion = computed<QuizQuestion>(
    () => this.quiz().questions[this.questionIndex()] ?? this.quiz().questions[0]
  );
  readonly isLastQuestion = computed(() => this.questionIndex() >= this.totalQuestions() - 1);
  readonly progressPercent = computed(() => {
    const done = this.questionIndex() + (this.revealed() ? 1 : 0);
    return (done / this.totalQuestions()) * 100;
  });

  readonly timerCircumference = 2 * Math.PI * 30;
  readonly timerOffset = computed(() => {
    const progress = 1 - this.timeLeft() / QUESTION_TIME;
    return this.timerCircumference * progress;
  });

  private timerId: number | null = null;
  private slideEnterFrameId: number | null = null;
  private slideExitTimeoutId: number | null = null;
  private readonly prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private isAnimating = false;

  ngOnInit(): void {
    const routeQuizId = this.route.snapshot.paramMap.get('quizId');
    const stateQuizId = this.readStateString('quizId');
    const requestedQuizId = routeQuizId ?? stateQuizId;
    const resolvedQuiz = QUIZZES.find(quiz => quiz.id === requestedQuizId) ?? QUIZZES[0];
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
    this.selectedOptionId.set(optionId);
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
      this.triggerSlideIn();
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
    }, 250);
  }

  handleBack(): void {
    this.analytics.track('quiz_abandoned', { quizId: this.quiz().id, qIdx: this.questionIndex() });
    window.history.back();
  }

  feedbackText(): string {
    const chosenId = this.selectedOptionId();
    const correctId = this.currentQuestion().correctId;
    if (chosenId === null) return "⏱ Time's up!";
    return chosenId === correctId ? '✓ Correct!' : '✗ Not quite';
  }

  feedbackColor(): string {
    return this.selectedOptionId() === this.currentQuestion().correctId
      ? 'var(--c-lt-correct-dark)'
      : 'var(--c-error)';
  }

  nextLabel(): string {
    if (this.isLastQuestion() && this.revealed()) {
      return `Finish · ${this.score()}/${this.totalQuestions()}`;
    }
    return 'Next';
  }

  optionLetter(index: number): string {
    return OPTION_LETTERS[index] ?? '?';
  }

  showCorrectIcon(optionId: string): boolean {
    return this.revealed() && optionId === this.currentQuestion().correctId;
  }

  showWrongIcon(optionId: string): boolean {
    return this.revealed() && this.selectedOptionId() === optionId && optionId !== this.currentQuestion().correctId;
  }

  timerLabel(): string {
    return String(this.timeLeft()).padStart(2, '0');
  }

  timerStroke(): string {
    if (this.timeLeft() <= 5) return 'var(--c-error)';
    return `url(#${this.timerGradientId})`;
  }

  optionStyle(optionId: string): Record<string, string> {
    const selected = this.selectedOptionId();
    const correctId = this.currentQuestion().correctId;
    const isCorrect = optionId === correctId;
    const isChosen = selected === optionId;
    const isWrong = isChosen && !isCorrect;

    let rowBackground = 'var(--c-lt-surface)';
    let rowBorder = 'transparent';
    let textColor = 'var(--c-lt-text-1)';

    if (!this.revealed() && isChosen) {
      rowBorder = 'var(--c-lt-brand)';
    } else if (this.revealed() && isCorrect) {
      rowBackground = 'var(--c-correct-bg)';
      rowBorder = 'var(--c-correct-border)';
      textColor = 'var(--c-lt-correct-dark)';
    } else if (this.revealed() && isWrong) {
      rowBackground = 'var(--c-error-bg)';
      rowBorder = 'var(--c-error-border)';
      textColor = 'var(--c-error)';
    } else if (this.revealed()) {
      textColor = 'var(--c-lt-text-2)';
    }

    return {
      width: '100%',
      height: 'var(--sp-14)',
      borderRadius: 'calc(var(--sp-12) + var(--sp-1))',
      border: `1.5px solid ${rowBorder}`,
      background: rowBackground,
      boxShadow: '0px 2px 4px 0px var(--f-brand-color-shadow-default)',
      color: textColor,
      font: 'var(--f-brand-type-body)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-4)',
      paddingLeft: 'var(--sp-2)',
      paddingRight: 'var(--sp-6)',
      cursor: this.revealed() ? 'default' : 'pointer',
      textAlign: 'left',
      transition:
        'background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
    };
  }

  optionBadgeStyle(optionId: string): Record<string, string> {
    const selected = this.selectedOptionId();
    const correctId = this.currentQuestion().correctId;
    const isCorrect = optionId === correctId;
    const isChosen = selected === optionId;

    if (this.revealed() && isCorrect) {
      return {
        background: 'var(--c-correct)',
        color: 'var(--c-lt-white)',
      };
    }
    if (this.revealed() && isChosen && !isCorrect) {
      return {
        background: 'var(--c-error)',
        color: 'var(--c-lt-white)',
      };
    }
    if (!this.revealed() && isChosen) {
      return {
        background: 'var(--c-lt-brand)',
        color: 'var(--c-lt-white)',
      };
    }
    return {
      background: 'var(--c-lt-bg)',
      color: this.revealed() ? 'var(--c-lt-text-2)' : 'var(--c-lt-text-1)',
    };
  }

  nextButtonStyle(): Record<string, string> {
    return {
      width: '100%',
      height: 'var(--sp-14)',
      border: 'none',
      borderRadius: 'var(--sp-8)',
      background: this.revealed() ? 'var(--c-lt-brand)' : 'var(--c-lt-border)',
      color: this.revealed() ? 'var(--c-lt-white)' : 'var(--c-lt-text-2)',
      font: 'var(--f-brand-type-body-medium)',
      cursor: this.revealed() ? 'pointer' : 'default',
      transition:
        'background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
    };
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
    // Double-rAF ensures the browser paints the offscreen position before
    // we apply the transition — Angular signals can batch single-rAF updates
    // into the same paint cycle, preventing the transition from firing.
    this.slideEnterFrameId = window.requestAnimationFrame(() => {
      this.slideEnterFrameId = window.requestAnimationFrame(() => {
        this.slideStyle.set({
          transform: 'translateX(0)',
          opacity: '1',
          transition: SLIDE_TRANSITION,
        });
        this.slideEnterFrameId = null;
      });
    });
  }

  private advanceToNextQuestion(): void {
    this.questionIndex.update(value => value + 1);
    this.selectedOptionId.set(null);
    this.revealed.set(false);
    this.timeLeft.set(QUESTION_TIME);
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

  private readStateString(key: string): string | null {
    const state = window.history.state as Record<string, unknown> | null;
    const value = state?.[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
