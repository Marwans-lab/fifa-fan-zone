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

import { SWIPE_QUIZZES, type SwipeQuiz } from '../../data/swipeQuizzes';
import { FLOW_IDS, type FlowId } from '../models/flow-id.model';
import { AnalyticsService } from '../services/analytics.service';
import { StoreService } from '../services/store.service';

const SWIPE_THRESHOLD = 80;
const FEEDBACK_DURATION = 900;
const EXIT_DURATION = 260;

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
            <
          </button>
          <div style="flex: 1; text-align: center; font: var(--f-brand-type-subheading-medium)">
            {{ quiz().title }}
          </div>
          <div
            style="
              min-width: var(--sp-12);
              min-height: var(--sp-8);
              border-radius: var(--r-full);
              display: flex;
              align-items: center;
              justify-content: center;
              background: var(--c-surface);
              border: var(--f-brand-border-size-default) solid var(--c-border);
              font: var(--f-brand-type-caption-medium);
              color: var(--c-accent);
            "
          >
            {{ score() }}/{{ totalStatements() }}
          </div>
        </header>

        <div style="display: flex; justify-content: center; gap: var(--sp-1)">
          @for (entry of resultDots(); track $index; let i = $index) {
            <span
              [ngStyle]="dotStyle(i, entry)"
              style="
                display: inline-block;
                min-height: var(--sp-2);
                border-radius: var(--r-full);
              "
            ></span>
          }
        </div>

        <div
          (pointerdown)="handlePointerDown($event)"
          (pointermove)="handlePointerMove($event)"
          (pointerup)="handlePointerUp()"
          (pointercancel)="handlePointerUp()"
          style="
            flex: 1;
            position: relative;
            overflow: hidden;
            touch-action: none;
            user-select: none;
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
            "
          >
            <div
              style="
                width: 100%;
                height: 100%;
                border-radius: var(--f-brand-radius-outer);
                border: var(--f-brand-border-size-default) solid var(--c-border);
                background: var(--c-surface);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: var(--sp-4);
                padding: var(--sp-5);
                text-align: center;
                position: relative;
                overflow: hidden;
              "
            >
              <span
                [style.opacity]="trueLabelOpacity()"
                style="
                  position: absolute;
                  top: var(--sp-4);
                  right: var(--sp-4);
                  padding: 0 var(--sp-2);
                  min-height: var(--sp-7);
                  display: inline-flex;
                  align-items: center;
                  border-radius: var(--f-brand-radius-base);
                  border: var(--f-brand-border-size-focused) solid var(--c-correct-border);
                  color: var(--c-correct);
                  font: var(--f-brand-type-caption-medium);
                  transition: opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
                "
              >
                {{ labels().right }}
              </span>
              <span
                [style.opacity]="falseLabelOpacity()"
                style="
                  position: absolute;
                  top: var(--sp-4);
                  left: var(--sp-4);
                  padding: 0 var(--sp-2);
                  min-height: var(--sp-7);
                  display: inline-flex;
                  align-items: center;
                  border-radius: var(--f-brand-radius-base);
                  border: var(--f-brand-border-size-focused) solid var(--c-error-border);
                  color: var(--c-error);
                  font: var(--f-brand-type-caption-medium);
                  transition: opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
                "
              >
                {{ labels().left }}
              </span>

              @if (feedbackState() !== null) {
                <div
                  style="
                    width: var(--sp-16);
                    min-height: var(--sp-16);
                    border-radius: var(--r-full);
                    display: grid;
                    place-items: center;
                    font: var(--f-brand-type-title-3);
                  "
                  [ngStyle]="feedbackIconStyle()"
                >
                  {{ feedbackState() === 'correct' ? 'OK' : 'NO' }}
                </div>
                <p style="margin: 0; font: var(--f-brand-type-caption); color: var(--c-text-2)">
                  {{ currentStatement().explanation }}
                </p>
              } @else {
                <p
                  style="
                    margin: 0;
                    font: var(--f-brand-type-title-4);
                    color: var(--c-text-1);
                  "
                >
                  {{ currentStatement().statement }}
                </p>
                <p style="margin: 0; font: var(--f-brand-type-caption); color: var(--c-text-2)">
                  Swipe to answer
                </p>
              }
            </div>
          </article>
        </div>

        <div style="display: flex; justify-content: center; gap: var(--sp-8); padding-bottom: var(--sp-2)">
          <button
            type="button"
            data-ui="swipe-false-btn"
            aria-label="Swipe false"
            [disabled]="isLocked()"
            (click)="answerWithDirection('left')"
            style="
              width: var(--sp-14);
              min-height: var(--sp-14);
              border-radius: var(--r-full);
              border: var(--f-brand-border-size-focused) solid var(--c-error-border);
              background: var(--c-error-bg);
              color: var(--c-error);
              font: var(--f-brand-type-title-4);
              cursor: pointer;
            "
          >
            X
          </button>
          <button
            type="button"
            data-ui="swipe-true-btn"
            aria-label="Swipe true"
            [disabled]="isLocked()"
            (click)="answerWithDirection('right')"
            style="
              width: var(--sp-14);
              min-height: var(--sp-14);
              border-radius: var(--r-full);
              border: var(--f-brand-border-size-focused) solid var(--c-correct-border);
              background: var(--c-correct-bg);
              color: var(--c-correct);
              font: var(--f-brand-type-title-4);
              cursor: pointer;
            "
          >
            O
          </button>
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
  readonly isLocked = signal(false);
  readonly feedbackState = signal<'correct' | 'incorrect' | null>(null);

  readonly totalStatements = computed(() => this.quiz().statements.length);
  readonly currentStatement = computed(() => this.quiz().statements[this.currentIndex()]);
  readonly labels = computed(() => this.quiz().labels ?? { right: 'True', left: 'False' });
  readonly resultDots = computed(() => this.results());
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
    this.analytics.track('swipe_quiz_viewed', { quizId: resolvedQuiz.id });
  }

  handlePointerDown(event: PointerEvent): void {
    if (this.isLocked()) return;
    this.dragStartX = event.clientX;
    this.isDragging.set(true);
  }

  handlePointerMove(event: PointerEvent): void {
    if (!this.isDragging() || this.isLocked()) return;
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
    if (this.isLocked()) return;
    this.isLocked.set(true);
    const swipedRight = direction === 'right';
    const statement = this.currentStatement();
    const correct = swipedRight === statement.isTrue;
    if (correct) {
      this.score.update(value => value + 1);
      this.feedbackState.set('correct');
    } else {
      this.feedbackState.set('incorrect');
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
      this.cardOffsetX.set(direction === 'right' ? 500 : -500);
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

  dotStyle(index: number, result: boolean | null): Record<string, string> {
    const isCurrent = index === this.currentIndex();
    if (result === true) {
      return {
        width: 'var(--sp-6)',
        background: 'var(--c-correct)',
      };
    }
    if (result === false) {
      return {
        width: 'var(--sp-6)',
        background: 'var(--c-error)',
      };
    }
    return {
      width: isCurrent ? 'var(--sp-6)' : 'var(--sp-2)',
      background: isCurrent ? 'var(--c-text-1)' : 'var(--c-surface-raise)',
      transition: 'all var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
    };
  }

  cardStyle(): Record<string, string> {
    const rotation = this.cardOffsetX() * 0.12;
    return {
      transform: `translateX(${this.cardOffsetX()}px) rotate(${rotation}deg)`,
      transition: this.isDragging()
        ? 'none'
        : `transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)`,
    };
  }

  feedbackIconStyle(): Record<string, string> {
    if (this.feedbackState() === 'correct') {
      return {
        background: 'var(--c-correct-bg)',
        color: 'var(--c-correct)',
        border: `var(--f-brand-border-size-focused) solid var(--c-correct-border)`,
      };
    }
    return {
      background: 'var(--c-error-bg)',
      color: 'var(--c-error)',
      border: `var(--f-brand-border-size-focused) solid var(--c-error-border)`,
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
    this.cardOffsetX.set(0);
    this.isLocked.set(false);
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
