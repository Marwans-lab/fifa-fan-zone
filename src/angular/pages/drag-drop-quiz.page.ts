import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DRAG_DROP_QUIZZES, type DragDropQuestion, type DragDropQuiz } from '../../data/dragDropQuizzes';
import { AnalyticsService } from '../services/analytics.service';
import { StoreService } from '../services/store.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main
      data-page="drag-drop-quiz"
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

        <div
          style="
            border-radius: var(--f-brand-radius-inner);
            border: var(--f-brand-border-size-default) solid var(--c-border);
            background: var(--c-surface);
            padding: var(--sp-4);
          "
        >
          <h1
            style="
              margin: 0 0 var(--sp-2);
              font: var(--f-brand-type-title-4);
              color: var(--c-text-1);
              text-align: center;
            "
          >
            {{ currentQuestion().title }}
          </h1>
          <p style="margin: 0; text-align: center; font: var(--f-brand-type-caption); color: var(--c-text-2)">
            {{ quiz().title }}
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: var(--sp-2)">
          @for (pair of currentQuestion().pairs; track pair.id) {
            <div
              style="
                border-radius: var(--f-brand-radius-base);
                border: var(--f-brand-border-size-default) dashed var(--c-border);
                background: var(--c-surface);
                padding: var(--sp-3);
                display: flex;
                align-items: center;
                gap: var(--sp-2);
              "
            >
              <span style="font: var(--f-brand-type-caption-medium); color: var(--c-text-1); min-width: 42%">
                {{ pair.prompt }}
              </span>
              <select
                [ngModel]="placements()[pair.id] ?? ''"
                (ngModelChange)="placeAnswer(pair.id, $event)"
                style="
                  flex: 1;
                  min-height: var(--sp-10);
                  border-radius: var(--f-brand-radius-base);
                  border: var(--f-brand-border-size-default) solid var(--c-border);
                  background: var(--c-bg);
                  color: var(--c-text-1);
                  font: var(--f-brand-type-caption);
                  padding: 0 var(--sp-2);
                "
              >
                <option value="">Select</option>
                @for (answer of availableAnswersForPair(pair.id); track answer) {
                  <option [value]="answer">{{ answer }}</option>
                }
              </select>
            </div>
          }
        </div>

        @if (revealed()) {
          <p
            style="
              margin: 0;
              text-align: center;
              font: var(--f-brand-type-caption-medium);
              color: var(--c-correct);
            "
          >
            {{ correctInCurrentQuestion() }}/{{ currentQuestion().pairs.length }} correct
          </p>
        }

        <button
          type="button"
          data-ui="next-btn"
          [disabled]="!allPlaced()"
          (click)="handleNextOrFinish()"
          [ngStyle]="nextButtonStyle()"
          style="
            margin-top: auto;
            width: 100%;
            min-height: var(--sp-14);
            border: none;
            border-radius: var(--f-brand-radius-rounded);
            font: var(--f-brand-type-body-medium);
          "
        >
          {{ nextLabel() }}
        </button>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DragDropQuizPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(StoreService);
  private readonly analytics = inject(AnalyticsService);

  readonly quiz = signal<DragDropQuiz>(DRAG_DROP_QUIZZES[0]);
  readonly questionIndex = signal(0);
  readonly score = signal(0);
  readonly placements = signal<Record<string, string | null>>({});
  readonly revealed = signal(false);

  readonly totalQuestions = computed(() => this.quiz().questions.length);
  readonly currentQuestion = computed<DragDropQuestion>(
    () => this.quiz().questions[this.questionIndex()] ?? this.quiz().questions[0]
  );
  readonly allPlaced = computed(() =>
    this.currentQuestion().pairs.every(pair => Boolean(this.placements()[pair.id]))
  );
  readonly correctInCurrentQuestion = computed(() => {
    const current = this.currentQuestion();
    return current.pairs.reduce((count, pair) => {
      return count + (this.placements()[pair.id] === pair.answer ? 1 : 0);
    }, 0);
  });
  readonly progressPercent = computed(
    () => ((this.questionIndex() + 1) / this.totalQuestions()) * 100
  );

  ngOnInit(): void {
    const routeQuizId = this.route.snapshot.paramMap.get('quizId');
    const stateQuizId = this.readStateString('quizId');
    const quizId = routeQuizId ?? stateQuizId;
    const quiz = DRAG_DROP_QUIZZES.find(entry => entry.id === quizId) ?? DRAG_DROP_QUIZZES[0];
    this.quiz.set(quiz);
    this.resetPlacements();
    this.analytics.track('drag_drop_quiz_viewed', { quizId: quiz.id });
  }

  placeAnswer(pairId: string, answer: unknown): void {
    this.revealed.set(false);
    const answerValue = typeof answer === 'string' ? answer : '';
    this.placements.update(prev => ({
      ...prev,
      [pairId]: answerValue.length > 0 ? answerValue : null,
    }));
  }

  availableAnswersForPair(pairId: string): string[] {
    const answers = this.currentQuestion().pairs.map(pair => pair.answer);
    const selectedByOthers = new Set(
      Object.entries(this.placements())
        .filter(([key, value]) => key !== pairId && typeof value === 'string' && value.length > 0)
        .map(([, value]) => value as string)
    );
    return answers.filter(answer => !selectedByOthers.has(answer) || this.placements()[pairId] === answer);
  }

  handleNextOrFinish(): void {
    if (!this.allPlaced()) return;
    const gained = this.correctInCurrentQuestion();
    this.revealed.set(true);
    this.score.update(value => value + gained);
    const isLast = this.questionIndex() >= this.totalQuestions() - 1;
    if (isLast) {
      const finalScore = this.score();
      const total = this.totalQuestions() * this.currentQuestion().pairs.length;
      const quiz = this.quiz();
      this.store.addPoints(finalScore);
      this.store.recordQuizResult(quiz.id, finalScore, total);
      this.analytics.track('drag_drop_quiz_completed', {
        quizId: quiz.id,
        score: finalScore,
        total,
      });
      void this.router.navigate(['/results'], {
        state: { score: finalScore, total, quizTitle: quiz.title },
      });
      return;
    }

    this.questionIndex.update(value => value + 1);
    this.resetPlacements();
  }

  handleBack(): void {
    this.analytics.track('drag_drop_quiz_abandoned', {
      quizId: this.quiz().id,
      qIdx: this.questionIndex(),
    });
    window.history.back();
  }

  nextButtonStyle(): Record<string, string> {
    return {
      background: this.allPlaced() ? 'var(--f-brand-color-background-primary)' : 'var(--c-border)',
      color: this.allPlaced() ? 'var(--f-brand-color-text-light)' : 'var(--c-text-2)',
      cursor: this.allPlaced() ? 'pointer' : 'default',
    };
  }

  nextLabel(): string {
    const isLast = this.questionIndex() >= this.totalQuestions() - 1;
    if (isLast) {
      const max = this.totalQuestions() * this.currentQuestion().pairs.length;
      return `Finish - ${this.score()}/${max}`;
    }
    return 'Next';
  }

  private resetPlacements(): void {
    const initial: Record<string, string | null> = {};
    for (const pair of this.currentQuestion().pairs) {
      initial[pair.id] = null;
    }
    this.placements.set(initial);
    this.revealed.set(false);
  }

  private readStateString(key: string): string | null {
    const state = window.history.state as Record<string, unknown> | null;
    const value = state?.[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
