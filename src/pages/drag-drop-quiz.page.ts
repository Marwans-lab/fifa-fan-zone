import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChildren,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ScreenComponent } from '../components/screen/screen.component';
import { DRAG_DROP_QUIZZES, type DragDropQuestion, type DragDropQuiz } from '../data/dragDropQuizzes';
import { AnalyticsService } from '../services/analytics.service';
import { StoreService } from '../services/store.service';

const KEYFRAMES_ID = 'drag-drop-quiz-keyframes';
const CHEVRON_LEFT_WHITE_ICON = 'assets/icons/Chevron-left-white.svg';
const SHAKE_CLEAR_DELAY_MS = 600;
const SLIDE_DURATION_MS = 280;

type DragPosition = { x: number; y: number };
type DragOffset = { x: number; y: number };
type ResultMap = Record<string, boolean | null>;

@Component({
  standalone: true,
  imports: [CommonModule, ScreenComponent],
  template: `
    <app-screen className="drag-drop-screen">
      <main data-page="drag-drop-quiz" [class.f-page-enter]="slideClass() === 'page-in'" class="drag-drop-page">
        <header data-section="header" class="drag-drop-header">
          <div class="drag-drop-header-row">
            <button
              type="button"
              class="f-button f-button--ghost drag-drop-back-btn"
              data-ui="back-btn"
              aria-label="Go back"
              (click)="handleBack()"
            >
              <img [src]="chevronLeftWhiteIcon" width="24" height="24" alt="" aria-hidden="true" />
            </button>

            <div class="drag-drop-progress-track">
              <div class="drag-drop-progress-fill" [style.width.%]="progressPercent()"></div>
            </div>

            <span class="drag-drop-progress-counter">{{ questionIndex() + 1 }}/{{ totalQuestions() }}</span>
          </div>
        </header>

        <div class="drag-drop-question-slide" [ngStyle]="slideAnimationStyle()">
          <div
            class="drag-drop-question-view"
            (touchmove)="onTouchMove($event)"
            (touchend)="onTouchEnd($event)"
            (touchcancel)="onTouchEnd($event)"
          >
            <section data-section="question-card" class="drag-drop-question-card" [ngStyle]="questionCardStyle()">
              <span class="drag-drop-question-emoji">{{ quiz().emoji }}</span>
              <h1 class="drag-drop-question-title">{{ currentQuestion().title }}</h1>
              <div class="drag-drop-question-overlay"></div>
            </section>

            <section data-section="drop-zones" class="drag-drop-zones-container">
              @for (pair of currentQuestion().pairs; track pair.id; let i = $index) {
                <div
                  class="drag-drop-zone-wrapper"
                  #dropZone
                  [attr.data-pair-id]="pair.id"
                  [attr.aria-label]="'Drop zone for ' + pair.prompt"
                >
                  <div [ngStyle]="zoneStyle(pair.id, i)" class="drag-drop-zone">
                    <span class="drag-drop-zone-prompt">{{ pair.prompt }}</span>
                    <div class="drag-drop-zone-content">
                      <div class="drag-drop-zone-inner">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path
                            d="M3 8h10M10 5l3 3-3 3"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                        <div [ngStyle]="zoneSlotStyle(pair.id)" class="drag-drop-zone-slot">
                          {{ placements()[pair.id] ?? '???' }}
                        </div>
                      </div>
                    </div>

                    @if (results()[pair.id] !== null) {
                      <div [ngStyle]="zoneResultIconStyle(pair.id)" class="drag-drop-zone-result-icon">
                        {{ results()[pair.id] ? '✓' : '✗' }}
                      </div>
                    }
                  </div>
                </div>
              }
            </section>

            <section data-section="draggable-items" class="drag-drop-chips-tray">
              <div class="drag-drop-chips-label">{{ allCorrect() ? '' : 'Drag answers to match' }}</div>
              <div class="drag-drop-chips-grid">
                @for (answer of availableAnswers(); track answer; let i = $index) {
                  <div
                    class="drag-drop-chip-wrapper"
                    #chipRef
                    [attr.data-answer]="answer"
                    role="button"
                    tabindex="0"
                    [attr.aria-label]="'Drag answer: ' + answer"
                    [ngStyle]="chipWrapperStyle(answer, i)"
                    (touchstart)="onTouchStart(answer, $event)"
                    (mousedown)="onMouseDown(answer, $event)"
                  >
                    <div [ngStyle]="chipStyle(answer, false)">
                      <span>{{ answer }}</span>
                    </div>
                  </div>
                }
              </div>
            </section>

            <footer class="drag-drop-footer">
              @if (allCorrect()) {
                <div class="drag-drop-success-message">✓ Perfect match!</div>
              }

              <button
                type="button"
                class="drag-drop-next-btn"
                data-ui="next-btn"
                [disabled]="!allCorrect()"
                [ngStyle]="nextButtonStyle()"
                (click)="handleCompleteQuestion()"
              >
                {{ nextLabel() }}
              </button>
            </footer>
          </div>
        </div>

        @if (draggedAnswer() && dragPos()) {
          <div class="drag-drop-ghost" [ngStyle]="ghostStyle()">
            <div [ngStyle]="chipStyle(draggedAnswer()!, true)">
              <span>{{ draggedAnswer() }}</span>
            </div>
          </div>
        }
      </main>
    </app-screen>
  `,
  styles: [
    `
      .drag-drop-screen {
        background: var(--c-bg);
      }

      .drag-drop-page {
        display: flex;
        flex-direction: column;
        min-height: 100%;
        max-width: 420px;
        margin: 0 auto;
        width: 100%;
      }

      .drag-drop-header {
        padding: var(--sp-4);
        flex-shrink: 0;
      }

      .drag-drop-header-row {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
      }

      .drag-drop-back-btn {
        width: var(--sp-11);
        min-height: var(--sp-11);
        padding: 0;
        border-radius: var(--r-full);
        border: var(--f-brand-border-size-default) solid var(--c-border);
        background: var(--c-surface);
        backdrop-filter: blur(var(--f-brand-blur-subtle));
        -webkit-backdrop-filter: blur(var(--f-brand-blur-subtle));
      }

      .drag-drop-progress-track {
        flex: 1;
        height: var(--sp-1);
        background: var(--f-brand-color-background-light);
        border-radius: var(--f-brand-radius-rounded);
        overflow: hidden;
      }

      .drag-drop-progress-fill {
        height: 100%;
        background: var(--f-brand-color-accent);
        border-radius: var(--f-brand-radius-rounded);
        transition: width var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
      }

      .drag-drop-progress-counter {
        flex-shrink: 0;
        font: var(--f-brand-type-caption);
        font-size: var(--text-xs);
        color: var(--c-text-2);
      }

      .drag-drop-question-slide {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .drag-drop-question-view {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;
      }

      .drag-drop-question-card {
        position: relative;
        margin: 0 var(--sp-4);
        padding: var(--sp-6) var(--sp-4);
        border-radius: var(--f-brand-radius-inner);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-bottom: var(--sp-4);
        flex-shrink: 0;
        overflow: hidden;
      }

      .drag-drop-question-emoji {
        font-size: var(--text-4xl);
        margin-bottom: var(--sp-1);
      }

      .drag-drop-question-title {
        margin: 0;
        font: var(--f-brand-type-title-5);
        font-size: var(--text-lg);
        color: var(--f-brand-color-text-default);
        text-align: center;
        line-height: var(--leading-snug);
        letter-spacing: var(--tracking-tight);
      }

      .drag-drop-question-overlay {
        position: absolute;
        inset: 0;
        background: var(--f-brand-fill-gradient-overlay-vertical);
        pointer-events: none;
      }

      .drag-drop-zones-container {
        flex: 1;
        padding: 0 var(--sp-4);
        display: flex;
        flex-direction: column;
        gap: var(--sp-2);
      }

      .drag-drop-zone-wrapper {
        border-radius: var(--f-brand-radius-inner);
      }

      .drag-drop-zone {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        padding: var(--sp-2) var(--sp-4);
        border-radius: var(--f-brand-radius-inner);
        min-height: var(--sp-12);
      }

      .drag-drop-zone-prompt {
        font: var(--f-brand-type-body-medium);
        font-size: var(--text-md);
        color: var(--f-brand-color-text-default);
        min-width: var(--sp-20);
        flex-shrink: 0;
      }

      .drag-drop-zone-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .drag-drop-zone-inner {
        display: flex;
        align-items: center;
        gap: var(--sp-1);
        width: 100%;
      }

      .drag-drop-zone-inner svg {
        opacity: 0.3;
        flex-shrink: 0;
      }

      .drag-drop-zone-slot {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--sp-1) var(--sp-2);
        border-radius: var(--f-brand-radius-rounded);
        font: var(--f-brand-type-caption-medium);
        font-size: var(--text-sm);
        min-height: var(--sp-9);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .drag-drop-zone-result-icon {
        width: var(--sp-6);
        min-height: var(--sp-6);
        border-radius: var(--r-full);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--text-2xs);
        font-weight: var(--weight-bold);
        color: var(--f-brand-color-text-light);
        flex-shrink: 0;
      }

      .drag-drop-chips-tray {
        padding: var(--sp-4);
        flex-shrink: 0;
      }

      .drag-drop-chips-label {
        font: var(--f-brand-type-caption-medium);
        font-size: var(--text-2xs);
        color: var(--f-brand-color-text-muted);
        letter-spacing: var(--tracking-wider);
        margin-bottom: var(--sp-2);
        text-align: center;
        min-height: var(--sp-4);
      }

      .drag-drop-chips-grid {
        display: flex;
        flex-wrap: wrap;
        gap: var(--sp-1);
        justify-content: center;
        min-height: var(--sp-12);
      }

      .drag-drop-chip-wrapper {
        -webkit-tap-highlight-color: transparent;
      }

      .drag-drop-footer {
        padding: 0 var(--sp-4) var(--sp-8);
        flex-shrink: 0;
      }

      .drag-drop-success-message {
        text-align: center;
        font: var(--f-brand-type-caption-medium);
        font-size: var(--text-sm);
        color: var(--f-brand-color-border-success);
        margin-bottom: var(--sp-2);
        letter-spacing: var(--tracking-wide);
        animation: popIn var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-entry);
      }

      .drag-drop-next-btn {
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

      .drag-drop-next-btn:disabled {
        cursor: default;
      }

      .drag-drop-ghost {
        position: fixed;
        pointer-events: none;
        z-index: 9999;
      }

      @keyframes shake {
        0%,
        100% {
          transform: translateX(0);
        }
        15% {
          transform: translateX(-6px) rotate(-1deg);
        }
        30% {
          transform: translateX(5px) rotate(1deg);
        }
        45% {
          transform: translateX(-4px);
        }
        60% {
          transform: translateX(3px);
        }
        75% {
          transform: translateX(-2px);
        }
      }

      @keyframes popIn {
        0% {
          transform: scale(0);
          opacity: 0;
        }
        60% {
          transform: scale(1.2);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      @keyframes dropZoneIn {
        0% {
          opacity: 0;
          transform: translateY(12px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes chipIn {
        0% {
          opacity: 0;
          transform: translateY(16px) scale(0.9);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes slideOutLeft {
        to {
          opacity: 0;
          transform: translateX(-60px);
        }
      }

      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(60px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes pulseGlow {
        0%,
        100% {
          box-shadow: 0 0 var(--sp-2) var(--f-brand-color-border-success);
        }
        50% {
          box-shadow: 0 0 var(--sp-6) var(--f-brand-color-border-success);
        }
      }

      @keyframes successBounce {
        0% {
          transform: scale(1);
        }
        30% {
          transform: scale(1.04);
        }
        60% {
          transform: scale(0.98);
        }
        100% {
          transform: scale(1);
        }
      }

      @keyframes scoreCountUp {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.3);
          color: var(--f-brand-color-border-success);
        }
        100% {
          transform: scale(1);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .drag-drop-progress-fill,
        .drag-drop-zone,
        .drag-drop-zone-slot,
        .drag-drop-next-btn,
        .drag-drop-chip-wrapper,
        .drag-drop-success-message {
          transition-duration: 0.01ms !important;
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DragDropQuizPage implements OnInit, OnDestroy {
  @ViewChildren('dropZone', { read: ElementRef }) private dropZoneRefs!: Array<ElementRef<HTMLElement>>;
  @ViewChildren('chipRef', { read: ElementRef }) private chipRefs!: Array<ElementRef<HTMLElement>>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(StoreService);
  private readonly analytics = inject(AnalyticsService);

  readonly chevronLeftWhiteIcon = CHEVRON_LEFT_WHITE_ICON;
  readonly quiz = signal<DragDropQuiz>(DRAG_DROP_QUIZZES[0]);
  readonly questionIndex = signal(0);
  readonly score = signal(0);
  readonly placements = signal<Record<string, string | null>>({});
  readonly results = signal<ResultMap>({});
  readonly hoveredZone = signal<string | null>(null);
  readonly shakingZone = signal<string | null>(null);
  readonly draggedAnswer = signal<string | null>(null);
  readonly dragPos = signal<DragPosition | null>(null);
  readonly dragOffset = signal<DragOffset>({ x: 0, y: 0 });
  readonly allCorrect = signal(false);
  readonly correctCount = signal(0);
  readonly shuffledAnswers = signal<string[]>([]);
  readonly slideClass = signal<'page-in' | 'slide-out-left' | 'slide-in-right' | ''>('page-in');

  readonly totalQuestions = computed(() => this.quiz().questions.length);
  readonly currentQuestion = computed<DragDropQuestion>(
    () => this.quiz().questions[this.questionIndex()] ?? this.quiz().questions[0]
  );
  readonly progressPercent = computed(() => ((this.questionIndex() + 1) / this.totalQuestions()) * 100);
  readonly availableAnswers = computed(() =>
    this.shuffledAnswers().filter(answer => {
      const question = this.currentQuestion();
      const placements = this.placements();
      const results = this.results();
      return !question.pairs.some(pair => placements[pair.id] === answer && results[pair.id] === true);
    })
  );

  private readonly prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly dropZoneElements = new Map<string, HTMLElement>();
  private readonly chipElements = new Map<string, HTMLElement>();
  private mouseMoveHandler: ((event: MouseEvent) => void) | null = null;
  private mouseUpHandler: (() => void) | null = null;
  private clearShakeTimeoutId: number | null = null;
  private slideTimeoutId: number | null = null;
  private isAnimating = false;

  ngOnInit(): void {
    this.ensureKeyframes();
    const routeQuizId = this.route.snapshot.paramMap.get('quizId');
    const stateQuizId = this.readStateString('quizId');
    const quizId = routeQuizId ?? stateQuizId;
    const quiz = DRAG_DROP_QUIZZES.find(entry => entry.id === quizId) ?? DRAG_DROP_QUIZZES[0];
    this.quiz.set(quiz);
    this.setupQuestionState(this.currentQuestion());
    this.analytics.track('drag_drop_quiz_viewed', { quizId: quiz.id });
  }

  ngOnDestroy(): void {
    this.detachMouseHandlers();
    if (this.clearShakeTimeoutId !== null) {
      window.clearTimeout(this.clearShakeTimeoutId);
    }
    if (this.slideTimeoutId !== null) {
      window.clearTimeout(this.slideTimeoutId);
    }
    const styleNode = document.getElementById(KEYFRAMES_ID);
    if (styleNode) {
      styleNode.remove();
    }
  }

  onTouchStart(answer: string, event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    if (!touch) return;
    this.startDrag(answer, touch.clientX, touch.clientY);
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.draggedAnswer()) return;
    event.preventDefault();
    const touch = event.touches[0];
    if (!touch) return;
    this.moveDrag(touch.clientX, touch.clientY);
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.draggedAnswer()) return;
    event.preventDefault();
    this.endDrag();
  }

  onMouseDown(answer: string, event: MouseEvent): void {
    event.preventDefault();
    this.startDrag(answer, event.clientX, event.clientY);
  }

  handleBack(): void {
    this.analytics.track('drag_drop_quiz_abandoned', {
      quizId: this.quiz().id,
      qIdx: this.questionIndex(),
    });
    window.history.back();
  }

  handleCompleteQuestion(): void {
    if (!this.allCorrect() || this.isAnimating) return;
    const earned = this.correctCount();
    const nextScore = this.score() + earned;
    const isLast = this.questionIndex() >= this.totalQuestions() - 1;

    if (isLast) {
      const total = this.totalQuestions() * this.currentQuestion().pairs.length;
      const quiz = this.quiz();
      this.store.addPoints(nextScore);
      this.store.recordQuizResult(quiz.id, nextScore, total);
      this.analytics.track('drag_drop_quiz_completed', {
        quizId: quiz.id,
        score: nextScore,
        total,
      });
      void this.router.navigate(['/results'], {
        state: { score: nextScore, total, quizTitle: quiz.title },
      });
      return;
    }

    this.score.set(nextScore);
    if (this.prefersReducedMotion) {
      this.questionIndex.update(value => value + 1);
      this.setupQuestionState(this.currentQuestion());
      this.slideClass.set('page-in');
      return;
    }

    this.isAnimating = true;
    this.slideClass.set('slide-out-left');
    if (this.slideTimeoutId !== null) {
      window.clearTimeout(this.slideTimeoutId);
    }
    this.slideTimeoutId = window.setTimeout(() => {
      this.questionIndex.update(value => value + 1);
      this.setupQuestionState(this.currentQuestion());
      this.slideClass.set('slide-in-right');
      this.isAnimating = false;
      this.slideTimeoutId = null;
    }, SLIDE_DURATION_MS);
  }

  slideAnimationStyle(): Record<string, string> {
    const slideClass = this.slideClass();
    if (slideClass === 'slide-out-left') {
      return {
        animation:
          'slideOutLeft var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default) forwards',
      };
    }
    if (slideClass === 'slide-in-right') {
      return {
        animation:
          'slideInRight var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-entry) forwards',
      };
    }
    return {};
  }

  questionCardStyle(): Record<string, string> {
    const accent = this.currentQuestion().accentColor;
    return {
      background: accent,
      boxShadow: `0 var(--sp-2) var(--sp-8) ${accent}55, inset 0 var(--f-brand-border-size-default) 0 rgba(255,255,255,0.15)`,
    };
  }

  zoneStyle(pairId: string, index: number): Record<string, string> {
    const hovered = this.hoveredZone() === pairId && !this.placements()[pairId];
    const result = this.results()[pairId];
    const shaking = this.shakingZone() === pairId;

    return {
      background: hovered
        ? 'var(--f-brand-color-background-accent)'
        : result === true
          ? 'var(--f-brand-color-background-success-accent)'
          : result === false
            ? 'var(--f-brand-color-background-error)'
            : 'var(--f-brand-color-background-light)',
      border: hovered
        ? '1.5px dashed var(--f-brand-color-accent)'
        : result === true
          ? '1.5px solid var(--f-brand-color-border-success)'
          : result === false
            ? '1.5px solid var(--f-brand-color-border-error)'
            : '1.5px dashed var(--f-brand-color-border-default)',
      transition:
        'background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), box-shadow var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
      transform: shaking ? 'translateX(0)' : hovered ? 'scale(1.02)' : 'scale(1)',
      boxShadow:
        result === true
          ? '0 0 var(--sp-5) var(--f-brand-color-border-success)'
          : hovered
            ? '0 0 var(--sp-4) var(--f-brand-color-border-accent)'
            : 'none',
      animation: shaking
        ? 'shake var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default)'
        : `dropZoneIn var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-entry) ${index * 60}ms both`,
    };
  }

  zoneSlotStyle(pairId: string): Record<string, string> {
    const placedAnswer = this.placements()[pairId];
    const result = this.results()[pairId];
    return {
      background: placedAnswer
        ? result === true
          ? 'var(--f-brand-color-background-success-accent)'
          : result === false
            ? 'var(--f-brand-color-background-error)'
            : 'var(--f-brand-color-background-light)'
        : 'var(--c-surface-faint)',
      border: placedAnswer ? 'none' : '1px dashed var(--f-brand-color-text-muted)',
      color: placedAnswer
        ? result === true
          ? 'var(--f-brand-color-border-success)'
          : result === false
            ? 'var(--f-brand-color-status-error)'
            : 'var(--f-brand-color-text-default)'
        : 'var(--f-brand-color-text-muted)',
      transition:
        'background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
    };
  }

  zoneResultIconStyle(pairId: string): Record<string, string> {
    return {
      background: this.results()[pairId]
        ? 'var(--f-brand-color-border-success)'
        : 'var(--f-brand-color-status-error)',
      animation: 'popIn var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-entry)',
    };
  }

  chipWrapperStyle(answer: string, index: number): Record<string, string> {
    return {
      animation: `chipIn var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-entry) ${index * 50}ms both`,
      opacity: this.draggedAnswer() === answer ? '0.3' : '1',
      transition:
        'opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
      transform: this.allCorrect() ? 'scale(0.98)' : 'scale(1)',
      cursor: this.allCorrect() ? 'default' : 'grab',
    };
  }

  chipStyle(answer: string, isGhost: boolean): Record<string, string> {
    const dragging = this.draggedAnswer() === answer;
    return {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--sp-2) var(--sp-4)',
      borderRadius: 'var(--f-brand-radius-rounded)',
      font: 'var(--f-brand-type-caption-medium)',
      fontSize: 'var(--text-sm)',
      color: 'var(--f-brand-color-text-default)',
      background: 'var(--f-brand-color-background-light)',
      border: '1.5px solid var(--f-brand-color-border-default)',
      cursor: dragging ? 'grabbing' : 'grab',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      touchAction: 'none',
      whiteSpace: 'nowrap',
      transition: dragging
        ? 'none'
        : 'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-entry), box-shadow var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-entry), background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
      transform: dragging || isGhost ? 'scale(1.08)' : 'scale(1)',
      boxShadow: dragging || isGhost
        ? '0 var(--sp-3) var(--sp-10) var(--c-error-glow), 0 0 0 var(--f-brand-border-size-default) var(--c-surface-raise)'
        : 'var(--f-brand-shadow-medium)',
      zIndex: dragging || isGhost ? '1000' : '1',
      pointerEvents: isGhost ? 'none' : 'auto',
    };
  }

  ghostStyle(): Record<string, string> {
    const pos = this.dragPos();
    if (!pos) return {};
    const offset = this.dragOffset();
    return {
      left: `${pos.x - offset.x}px`,
      top: `${pos.y - offset.y}px`,
      transform: 'translate(-50%, -50%) scale(1.08)',
    };
  }

  nextButtonStyle(): Record<string, string> {
    return {
      background: this.allCorrect()
        ? 'var(--f-brand-color-text-light)'
        : 'var(--f-brand-color-background-light)',
      color: this.allCorrect() ? 'var(--f-brand-color-primary)' : 'var(--f-brand-color-text-muted)',
      cursor: this.allCorrect() ? 'pointer' : 'default',
      animation: this.allCorrect()
        ? 'successBounce var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-entry)'
        : 'none',
    };
  }

  nextLabel(): string {
    const isLast = this.questionIndex() >= this.totalQuestions() - 1;
    if (isLast && this.allCorrect()) {
      const currentPairs = this.currentQuestion().pairs.length;
      const total = this.totalQuestions() * currentPairs;
      return `Finish · ${this.score() + currentPairs}/${total}`;
    }
    return 'Next';
  }

  private startDrag(answer: string, clientX: number, clientY: number): void {
    if (this.allCorrect()) return;
    this.refreshElementCaches();
    const chipEl = this.chipElements.get(answer);
    if (!chipEl) return;
    const rect = chipEl.getBoundingClientRect();
    this.dragOffset.set({
      x: clientX - rect.left - rect.width / 2,
      y: clientY - rect.top - rect.height / 2,
    });
    this.draggedAnswer.set(answer);
    this.dragPos.set({ x: clientX, y: clientY });
    this.attachMouseHandlers();
  }

  private moveDrag(clientX: number, clientY: number): void {
    if (!this.draggedAnswer()) return;
    this.dragPos.set({ x: clientX, y: clientY });
    this.hoveredZone.set(this.findHoveredZone(clientX, clientY));
  }

  private endDrag(): void {
    const dragged = this.draggedAnswer();
    const position = this.dragPos();
    if (dragged && position) {
      const zone = this.findHoveredZone(position.x, position.y);
      if (zone && this.placements()[zone] === null) {
        this.handleDrop(zone, dragged);
      }
    }
    this.draggedAnswer.set(null);
    this.dragPos.set(null);
    this.hoveredZone.set(null);
    this.detachMouseHandlers();
  }

  private handleDrop(pairId: string, answer: string): void {
    const pair = this.currentQuestion().pairs.find(entry => entry.id === pairId);
    if (!pair) return;
    if (this.placements()[pairId] !== null) return;

    const matched = pair.answer === answer;
    this.placements.update(prev => ({ ...prev, [pairId]: answer }));
    this.results.update(prev => ({ ...prev, [pairId]: matched }));

    if (matched) {
      this.correctCount.update(value => value + 1);
      this.analytics.track('drag_drop_correct', {
        quizId: this.quiz().id,
        questionId: this.currentQuestion().id,
        pairId,
      });
      this.checkAllCorrect();
      return;
    }

    this.shakingZone.set(pairId);
    this.analytics.track('drag_drop_incorrect', {
      quizId: this.quiz().id,
      questionId: this.currentQuestion().id,
      pairId,
    });
    if (this.clearShakeTimeoutId !== null) {
      window.clearTimeout(this.clearShakeTimeoutId);
    }
    this.clearShakeTimeoutId = window.setTimeout(() => {
      this.shakingZone.set(null);
      this.placements.update(prev => ({ ...prev, [pairId]: null }));
      this.results.update(prev => ({ ...prev, [pairId]: null }));
      this.clearShakeTimeoutId = null;
    }, SHAKE_CLEAR_DELAY_MS);
  }

  private checkAllCorrect(): void {
    const question = this.currentQuestion();
    const resultMap = this.results();
    const complete = question.pairs.length > 0 && question.pairs.every(pair => resultMap[pair.id] === true);
    this.allCorrect.set(complete);
  }

  private findHoveredZone(x: number, y: number): string | null {
    for (const pair of this.currentQuestion().pairs) {
      const zoneEl = this.dropZoneElements.get(pair.id);
      if (!zoneEl) continue;
      const rect = zoneEl.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return pair.id;
      }
    }
    return null;
  }

  private setupQuestionState(question: DragDropQuestion): void {
    const placements: Record<string, string | null> = {};
    const results: ResultMap = {};
    for (const pair of question.pairs) {
      placements[pair.id] = null;
      results[pair.id] = null;
    }
    this.placements.set(placements);
    this.results.set(results);
    this.hoveredZone.set(null);
    this.shakingZone.set(null);
    this.draggedAnswer.set(null);
    this.dragPos.set(null);
    this.dragOffset.set({ x: 0, y: 0 });
    this.correctCount.set(0);
    this.allCorrect.set(false);
    this.shuffledAnswers.set(this.shuffleAnswers(question));
    this.refreshElementCachesNextFrame();
  }

  private shuffleAnswers(question: DragDropQuestion): string[] {
    const answers = question.pairs.map(pair => pair.answer);
    const seed = question.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const shuffled = [...answers];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = ((seed * (i + 1) * 31) % (i + 1) + i + 1) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private refreshElementCachesNextFrame(): void {
    requestAnimationFrame(() => this.refreshElementCaches());
  }

  private refreshElementCaches(): void {
    this.dropZoneElements.clear();
    for (const ref of this.dropZoneRefs ?? []) {
      const element = ref.nativeElement;
      const pairId = element.dataset['pairId'];
      if (pairId) {
        this.dropZoneElements.set(pairId, element);
      }
    }

    this.chipElements.clear();
    for (const ref of this.chipRefs ?? []) {
      const element = ref.nativeElement;
      const answer = element.dataset['answer'];
      if (answer) {
        this.chipElements.set(answer, element);
      }
    }
  }

  private attachMouseHandlers(): void {
    if (this.mouseMoveHandler || this.mouseUpHandler) return;
    this.mouseMoveHandler = (event: MouseEvent) => this.moveDrag(event.clientX, event.clientY);
    this.mouseUpHandler = () => this.endDrag();
    window.addEventListener('mousemove', this.mouseMoveHandler);
    window.addEventListener('mouseup', this.mouseUpHandler);
  }

  private detachMouseHandlers(): void {
    if (this.mouseMoveHandler) {
      window.removeEventListener('mousemove', this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }
    if (this.mouseUpHandler) {
      window.removeEventListener('mouseup', this.mouseUpHandler);
      this.mouseUpHandler = null;
    }
  }

  private ensureKeyframes(): void {
    if (document.getElementById(KEYFRAMES_ID)) return;
    const style = document.createElement('style');
    style.id = KEYFRAMES_ID;
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        15% { transform: translateX(-6px) rotate(-1deg); }
        30% { transform: translateX(5px) rotate(1deg); }
        45% { transform: translateX(-4px); }
        60% { transform: translateX(3px); }
        75% { transform: translateX(-2px); }
      }
      @keyframes popIn {
        0% { transform: scale(0); opacity: 0; }
        60% { transform: scale(1.2); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes dropZoneIn {
        0% { opacity: 0; transform: translateY(12px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes chipIn {
        0% { opacity: 0; transform: translateY(16px) scale(0.9); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes slideOutLeft {
        to { opacity: 0; transform: translateX(-60px); }
      }
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(60px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes pulseGlow {
        0%, 100% { box-shadow: 0 0 8px var(--f-brand-color-border-success); }
        50% { box-shadow: 0 0 24px var(--f-brand-color-border-success); }
      }
      @keyframes successBounce {
        0% { transform: scale(1); }
        30% { transform: scale(1.04); }
        60% { transform: scale(0.98); }
        100% { transform: scale(1); }
      }
      @keyframes scoreCountUp {
        0% { transform: scale(1); }
        50% { transform: scale(1.3); color: var(--f-brand-color-border-success); }
        100% { transform: scale(1); }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private readStateString(key: string): string | null {
    const state = window.history.state as Record<string, unknown> | null;
    const value = state?.[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
