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
            gap: var(--sp-3);
            padding: var(--sp-12) var(--sp-4) var(--sp-4);
          "
        >
          <button
            type="button"
            data-ui="back-btn"
            aria-label="Close quiz"
            (click)="handleBack()"
            style="
              width: var(--sp-12);
              min-height: var(--sp-12);
              border-radius: var(--r-full);
              border: var(--f-brand-border-size-default) solid var(--c-lt-border);
              background: var(--c-lt-surface);
              color: var(--c-lt-text-1);
              font: var(--f-brand-type-headline);
              cursor: pointer;
              flex-shrink: 0;
            "
          >
            X
          </button>
          <div
            style="
              flex: 1;
              height: var(--sp-2);
              border-radius: var(--r-full);
              background: var(--c-lt-border);
              overflow: hidden;
            "
          >
            <div
              [style.width.%]="progressPercent()"
              style="
                height: 100%;
                border-radius: var(--r-full);
                background: var(--f-brand-color-background-primary);
                transition: width var(--f-brand-motion-duration-instant)
                  var(--f-brand-motion-easing-default);
              "
            ></div>
          </div>
        </header>

        <div style="padding: var(--sp-2) var(--sp-4) 0">
          <p
            style="
              margin: 0;
              text-align: center;
              color: var(--c-lt-text-2);
              font: var(--f-brand-type-caption);
            "
          >
            {{ quiz().title }} - Question {{ questionIndex() + 1 }} of {{ totalQuestions() }}
          </p>
        </div>

        <div
          style="
            padding: var(--sp-4);
            display: flex;
            justify-content: center;
            align-items: center;
            gap: var(--sp-4);
          "
        >
          <div style="position: relative; width: 64px; height: 64px">
            <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true" style="transform: rotate(-90deg)">
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--c-lt-border)" stroke-width="4"></circle>
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                [attr.stroke]="timeLeft() <= 5 ? 'var(--c-error)' : 'var(--f-brand-color-background-primary)'"
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
                color: var(--c-lt-text-1);
              "
            >
              {{ timeLeft() }}
            </span>
          </div>
        </div>

        <h1
          style="
            margin: 0;
            padding: 0 var(--sp-4);
            text-align: center;
            font: var(--f-brand-type-title-4);
            color: var(--c-lt-text-1);
          "
        >
          {{ currentQuestion().question }}
        </h1>

        <div
          style="
            margin-top: var(--sp-4);
            padding: 0 var(--sp-4);
            display: flex;
            flex-direction: column;
            gap: var(--sp-3);
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
                  width: 32px;
                  min-width: 32px;
                  min-height: 32px;
                  border-radius: var(--r-full);
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                "
              >
                {{ optionLabel(idx, opt.id) }}
              </span>
              <span style="flex: 1; text-align: left">
                {{ opt.label }}
              </span>
            </button>
          }
        </div>

        <div style="margin-top: auto; padding: var(--sp-5) var(--sp-4) var(--sp-8)">
          @if (revealed()) {
            <p
              style="
                margin: 0 0 var(--sp-3);
                text-align: center;
                font: var(--f-brand-type-caption-medium);
                color: var(--c-lt-text-1);
              "
            >
              {{ feedbackText() }}
            </p>
          }
          <button
            type="button"
            data-ui="next-question-btn"
            (click)="handleNext()"
            [disabled]="!revealed()"
            [ngStyle]="nextButtonStyle()"
          >
            {{ nextLabel() }}
          </button>
        </div>
      </section>
    </main>
  `,
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

  readonly totalQuestions = computed(() => this.quiz().questions.length);
  readonly currentQuestion = computed<QuizQuestion>(
    () => this.quiz().questions[this.questionIndex()] ?? this.quiz().questions[0]
  );
  readonly isLastQuestion = computed(() => this.questionIndex() >= this.totalQuestions() - 1);
  readonly progressPercent = computed(() => {
    const done = this.questionIndex() + (this.revealed() ? 1 : 0);
    return (done / this.totalQuestions()) * 100;
  });

  readonly timerCircumference = 2 * Math.PI * 28;
  readonly timerOffset = computed(() => {
    const progress = 1 - this.timeLeft() / QUESTION_TIME;
    return this.timerCircumference * progress;
  });

  private timerId: number | null = null;

  ngOnInit(): void {
    const routeQuizId = this.route.snapshot.paramMap.get('quizId');
    const stateQuizId = this.readStateString('quizId');
    const requestedQuizId = routeQuizId ?? stateQuizId;
    const resolvedQuiz = QUIZZES.find(quiz => quiz.id === requestedQuizId) ?? QUIZZES[0];
    this.quiz.set(resolvedQuiz);
    this.analytics.track('quiz_viewed', { quizId: resolvedQuiz.id });
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.stopTimer();
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
    if (!this.revealed()) return;
    if (this.isLastQuestion()) {
      this.finishQuiz();
      return;
    }
    this.questionIndex.update(value => value + 1);
    this.selectedOptionId.set(null);
    this.revealed.set(false);
    this.timeLeft.set(QUESTION_TIME);
    this.startTimer();
  }

  handleBack(): void {
    this.analytics.track('quiz_abandoned', { quizId: this.quiz().id, qIdx: this.questionIndex() });
    window.history.back();
  }

  feedbackText(): string {
    const chosenId = this.selectedOptionId();
    const correctId = this.currentQuestion().correctId;
    if (chosenId === null) return "Time's up!";
    return chosenId === correctId ? 'Correct!' : 'Not quite';
  }

  nextLabel(): string {
    if (!this.isLastQuestion()) return 'Next';
    return `Finish - ${this.score()}/${this.totalQuestions()}`;
  }

  optionLabel(index: number, optionId: string): string {
    if (!this.revealed()) return OPTION_LETTERS[index] ?? '?';
    if (optionId === this.currentQuestion().correctId) return 'OK';
    if (this.selectedOptionId() === optionId) return 'X';
    return OPTION_LETTERS[index] ?? '?';
  }

  optionStyle(optionId: string): Record<string, string> {
    const selected = this.selectedOptionId();
    const correctId = this.currentQuestion().correctId;
    const isCorrect = optionId === correctId;
    const isChosen = selected === optionId;

    if (!this.revealed() && isChosen) {
      return {
        width: '100%',
        minHeight: 'var(--sp-14)',
        borderRadius: 'var(--r-full)',
        border: `var(--f-brand-border-size-focused) solid var(--c-lt-brand)`,
        background: 'var(--c-lt-surface)',
        color: 'var(--c-lt-text-1)',
        font: 'var(--f-brand-type-body-medium)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-3)',
        padding: '0 var(--sp-3)',
        cursor: 'pointer',
      };
    }

    if (this.revealed() && isCorrect) {
      return {
        width: '100%',
        minHeight: 'var(--sp-14)',
        borderRadius: 'var(--r-full)',
        border: `var(--f-brand-border-size-default) solid var(--c-correct-border)`,
        background: 'var(--c-correct-bg)',
        color: 'var(--c-lt-correct-dark)',
        font: 'var(--f-brand-type-body-medium)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-3)',
        padding: '0 var(--sp-3)',
      };
    }

    if (this.revealed() && isChosen && !isCorrect) {
      return {
        width: '100%',
        minHeight: 'var(--sp-14)',
        borderRadius: 'var(--r-full)',
        border: `var(--f-brand-border-size-default) solid var(--c-error-border)`,
        background: 'var(--c-error-bg)',
        color: 'var(--c-error)',
        font: 'var(--f-brand-type-body-medium)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-3)',
        padding: '0 var(--sp-3)',
      };
    }

    return {
      width: '100%',
      minHeight: 'var(--sp-14)',
      borderRadius: 'var(--r-full)',
      border: `var(--f-brand-border-size-default) solid var(--c-lt-border)`,
      background: 'var(--c-lt-surface)',
      color: this.revealed() ? 'var(--c-lt-text-2)' : 'var(--c-lt-text-1)',
      font: 'var(--f-brand-type-body-medium)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-3)',
      padding: '0 var(--sp-3)',
      cursor: this.revealed() ? 'default' : 'pointer',
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
        color: 'var(--f-brand-color-text-light)',
      };
    }
    if (this.revealed() && isChosen && !isCorrect) {
      return {
        background: 'var(--c-error)',
        color: 'var(--f-brand-color-text-light)',
      };
    }
    if (!this.revealed() && isChosen) {
      return {
        background: 'var(--c-lt-brand)',
        color: 'var(--f-brand-color-text-light)',
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
      minHeight: 'var(--sp-14)',
      border: 'none',
      borderRadius: 'var(--f-brand-radius-rounded)',
      background: this.revealed() ? 'var(--c-lt-brand)' : 'var(--c-lt-border)',
      color: this.revealed() ? 'var(--f-brand-color-text-light)' : 'var(--c-lt-text-2)',
      font: 'var(--f-brand-type-body-medium)',
      cursor: this.revealed() ? 'pointer' : 'default',
    };
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
