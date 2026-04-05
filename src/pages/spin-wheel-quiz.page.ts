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

import {
  SPIN_WHEEL_QUIZZES,
  type SpinWheelQuestion,
  type SpinWheelQuiz,
} from '../data/spinWheelQuizzes';
import { FLOW_IDS, type FlowId } from '../models/flow-id.model';
import { AnalyticsService } from '../services/analytics.service';
import { StoreService } from '../services/store.service';

// ─── Wheel geometry constants ────────────────────────────────────────────────
const SEGMENT_COUNT = 12;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT; // 30° per segment
const OUTER_RADIUS = 46;
const INNER_RADIUS = 22;
const CX = 50;
const CY = 50;
// -1 is a blank spacer segment; 0–10 are selectable values
const SEGMENT_VALUES: readonly number[] = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
// Initial rotation shows value 5 (index 6) at the pointer
const INITIAL_ROTATION = -6 * SEGMENT_ANGLE; // -180°

// ─── Animation constants ─────────────────────────────────────────────────────
const SNAP_SPRING = 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';
const SLIDE_TRANSITION =
  'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)';
const SLIDE_EXIT_MS = 250;

// ─── Types ────────────────────────────────────────────────────────────────────
interface WheelSegment {
  readonly index: number;
  readonly value: number;
  readonly path: string;
  readonly textX: number;
  readonly textY: number;
  readonly textAngle: number;
  readonly label: string;
}

// ─── Segment geometry helper ──────────────────────────────────────────────────
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function buildSegments(): WheelSegment[] {
  const segs: WheelSegment[] = [];
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const startDeg = i * SEGMENT_ANGLE - 90; // -90 → segment 0 starts at 12 o'clock
    const endDeg = (i + 1) * SEGMENT_ANGLE - 90;
    const startRad = degToRad(startDeg);
    const endRad = degToRad(endDeg);
    const midRad = (startRad + endRad) / 2;

    // Outer arc points (clockwise)
    const ox1 = (CX + OUTER_RADIUS * Math.cos(startRad)).toFixed(3);
    const oy1 = (CY + OUTER_RADIUS * Math.sin(startRad)).toFixed(3);
    const ox2 = (CX + OUTER_RADIUS * Math.cos(endRad)).toFixed(3);
    const oy2 = (CY + OUTER_RADIUS * Math.sin(endRad)).toFixed(3);

    // Inner arc points (counter-clockwise for closing)
    const ix2 = (CX + INNER_RADIUS * Math.cos(endRad)).toFixed(3);
    const iy2 = (CY + INNER_RADIUS * Math.sin(endRad)).toFixed(3);
    const ix1 = (CX + INNER_RADIUS * Math.cos(startRad)).toFixed(3);
    const iy1 = (CY + INNER_RADIUS * Math.sin(startRad)).toFixed(3);

    // Donut arc path: outer clockwise, inner counter-clockwise
    const path = `M ${ox1} ${oy1} A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${INNER_RADIUS} ${INNER_RADIUS} 0 0 0 ${ix1} ${iy1} Z`;

    // Text positioned at arc midpoint
    const midTextR = (OUTER_RADIUS + INNER_RADIUS) / 2;
    const textX = CX + midTextR * Math.cos(midRad);
    const textY = CY + midTextR * Math.sin(midRad);
    const textAngle = (midRad * 180) / Math.PI + 90; // rotate to read radially

    segs.push({
      index: i,
      value: SEGMENT_VALUES[i],
      path,
      textX,
      textY,
      textAngle,
      label: SEGMENT_VALUES[i] === -1 ? '' : String(SEGMENT_VALUES[i]),
    });
  }
  return segs;
}

const SEGMENTS = buildSegments();

// ─── Component ────────────────────────────────────────────────────────────────
@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <main
      class="spin-wheel"
      data-page="spin-wheel-quiz"
      style="
        min-height: 100dvh;
        background: var(--c-lt-bg);
        color: var(--c-lt-text-1);
        display: flex;
        justify-content: center;
      "
    >
      <section
        class="spin-wheel__content"
        style="
          width: 100%;
          max-width: 420px;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
        "
      >
        <!-- ── Header: back button + progress bar ── -->
        <header
          class="spin-wheel__header"
          style="
            display: flex;
            align-items: center;
            gap: var(--sp-4);
            padding: var(--f-brand-space-md) var(--sp-4) 0;
            flex-shrink: 0;
          "
        >
          <button
            type="button"
            class="spin-wheel__back-btn"
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
              box-shadow: var(--f-brand-shadow-medium);
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
            class="spin-wheel__progress-track"
            style="
              flex: 1;
              height: var(--sp-2);
              border-radius: var(--r-full);
              background: var(--c-lt-surface);
              overflow: hidden;
            "
          >
            <div
              class="spin-wheel__progress-fill"
              [style.width.%]="progressPercent()"
              style="
                height: 100%;
                border-radius: var(--r-full);
                background: var(--f-brand-color-flight-status-confirmed);
                transition: width var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
              "
            ></div>
          </div>
        </header>

        <!-- ── Slide wrapper (animated on question advance) ── -->
        <div
          class="spin-wheel__slide"
          [ngStyle]="slideStyle()"
          style="
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          "
        >
          <!-- Question counter -->
          <p
            class="spin-wheel__q-counter"
            style="
              margin: var(--sp-5) 0 0;
              padding: 0 var(--sp-4);
              text-align: center;
              font: var(--f-brand-type-caption);
              color: var(--c-lt-text-2);
              flex-shrink: 0;
            "
          >
            Question {{ questionIndex() + 1 }} of {{ totalQuestions() }}
          </p>

          <!-- Question text -->
          <h1
            class="spin-wheel__question"
            style="
              margin: var(--sp-3) 0 0;
              padding: 0 var(--sp-6);
              text-align: center;
              font: 300 22px/30px var(--font-display);
              color: var(--c-lt-text-1);
              flex-shrink: 0;
            "
          >
            {{ currentQuestion().question }}
          </h1>

          <!-- Subtitle -->
          <p
            class="spin-wheel__subtitle"
            style="
              margin: var(--sp-2) 0 0;
              padding: 0 var(--sp-4);
              text-align: center;
              font: var(--f-brand-type-body);
              color: var(--c-lt-text-2);
              flex-shrink: 0;
            "
          >
            Spin to select your answer
          </p>

          <!-- ── Wheel ── -->
          <div
            class="spin-wheel__wheel-wrap"
            style="
              display: flex;
              align-items: center;
              justify-content: center;
              padding: var(--sp-6) var(--sp-4) 0;
              flex-shrink: 0;
            "
          >
            <!--
              role="slider": ARIA role for the wheel as a range input.
              tabindex="0": focusable for keyboard navigation.
              touch-action: none: prevents browser scroll interference.
            -->
            <svg
              class="spin-wheel__svg"
              viewBox="0 0 100 100"
              role="slider"
              aria-label="Answer selector"
              aria-valuemin="0"
              aria-valuemax="10"
              [attr.aria-valuenow]="selectedValue() >= 0 ? selectedValue() : 0"
              tabindex="0"
              style="
                width: 100%;
                max-width: 300px;
                aspect-ratio: 1 / 1;
                display: block;
                overflow: visible;
                touch-action: none;
              "
              [style.cursor]="isDragging() ? 'grabbing' : 'grab'"
              (pointerdown)="onWheelPointerDown($event)"
              (pointermove)="onWheelPointerMove($event)"
              (pointerup)="onWheelPointerUp($event)"
              (pointercancel)="onWheelPointerUp($event)"
              (keydown)="onWheelKeyDown($event)"
            >
              <!-- ── Rotating segments group ── -->
              <g [ngStyle]="wheelGroupStyle()">
                @for (seg of segments; track seg.index) {
                  <path
                    [attr.d]="seg.path"
                    [attr.fill]="segmentFill(seg)"
                    style="stroke: var(--c-lt-white); stroke-width: 1.4;"
                  />
                  @if (seg.label) {
                    <text
                      [attr.x]="f2(seg.textX)"
                      [attr.y]="f2(seg.textY)"
                      [attr.transform]="textTransform(seg)"
                      text-anchor="middle"
                      dominant-baseline="central"
                      [attr.fill]="segmentTextFill(seg)"
                      [attr.font-weight]="segmentTextWeight(seg)"
                      font-size="5.5"
                      style="
                        font-family: var(--font-display);
                        user-select: none;
                        pointer-events: none;
                      "
                    >{{ seg.label }}</text>
                  }
                }
              </g>

              <!-- ── Fixed centre overlay (non-rotating) ── -->
              <!-- Outer ring of centre area -->
              <circle
                cx="50"
                cy="50"
                r="21"
                style="fill: var(--c-lt-bg); pointer-events: none;"
              />
              <!-- Inner white circle -->
              <circle
                cx="50"
                cy="50"
                r="18"
                style="fill: var(--c-lt-surface); pointer-events: none;"
              />
              <!-- Current value number -->
              <text
                x="50"
                y="50"
                text-anchor="middle"
                dominant-baseline="central"
                font-size="11"
                font-weight="600"
                style="
                  fill: var(--c-lt-text-1);
                  font-family: var(--font-display);
                  user-select: none;
                  pointer-events: none;
                "
              >{{ centreLabel() }}</text>

              <!-- ── Fixed pointer triangle at 12 o'clock ── -->
              <polygon
                points="47,0 53,0 50,5"
                style="fill: var(--c-lt-text-3); pointer-events: none;"
              />
            </svg>
          </div>

          <!-- ── Feedback panel (shown after submit) ── -->
          @if (revealed()) {
            <div
              class="spin-wheel__feedback"
              [ngStyle]="feedbackBoxStyle()"
              style="
                margin: var(--sp-5) var(--sp-4) 0;
                padding: var(--sp-4) var(--sp-5);
                border-radius: var(--r-lg);
                border-width: 1px;
                border-style: solid;
                flex-shrink: 0;
              "
            >
              <p
                class="spin-wheel__feedback-title"
                style="
                  margin: 0 0 var(--sp-1);
                  font: var(--f-brand-type-body-medium);
                "
              >
                {{ feedbackTitle() }}
              </p>
              <p
                class="spin-wheel__feedback-body"
                style="
                  margin: 0;
                  font: var(--f-brand-type-body);
                  color: var(--c-lt-text-2);
                "
              >
                {{ currentQuestion().explanation }}
              </p>
            </div>
          }
        </div>

        <!-- ── Footer: submit / next button ── -->
        <div
          class="spin-wheel__footer"
          style="
            padding: var(--sp-5) var(--sp-4) var(--sp-10);
            flex-shrink: 0;
          "
        >
          <button
            type="button"
            class="spin-wheel__action-btn"
            data-ui="action-btn"
            [disabled]="!canAct()"
            (click)="handleAction()"
            [ngStyle]="actionBtnStyle()"
            style="
              width: 100%;
              height: var(--sp-16);
              border-radius: var(--r-xl);
              border: none;
              font: var(--f-brand-type-body-medium);
              display: flex;
              align-items: center;
              justify-content: center;
              transition:
                background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default),
                color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
            "
          >
            {{ actionBtnLabel() }}
          </button>
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      .spin-wheel__action-btn:focus-visible {
        outline: var(--f-brand-border-size-focused) solid var(--f-brand-color-border-focused);
        outline-offset: var(--f-brand-space-xs);
      }
      .spin-wheel__action-btn:disabled {
        cursor: not-allowed;
      }
      .spin-wheel__svg:focus-visible {
        outline: var(--f-brand-border-size-focused) solid var(--f-brand-color-border-focused);
        border-radius: var(--r-full);
        outline-offset: var(--sp-2);
      }
      @media (prefers-reduced-motion: reduce) {
        [data-page='spin-wheel-quiz'],
        [data-page='spin-wheel-quiz'] * {
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
export class SpinWheelQuizPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(StoreService);
  private readonly analytics = inject(AnalyticsService);

  readonly segments = SEGMENTS;

  // ── State signals ──
  readonly quiz = signal<SpinWheelQuiz>(SPIN_WHEEL_QUIZZES[0]);
  readonly questionIndex = signal(0);
  readonly score = signal(0);
  readonly revealed = signal(false);
  readonly lastPoints = signal(0);
  readonly wheelRotation = signal(INITIAL_ROTATION);
  readonly isDragging = signal(false);
  readonly slideStyle = signal<Record<string, string>>({
    transform: 'translateX(0)',
    opacity: '1',
    transition: SLIDE_TRANSITION,
  });

  // ── Derived signals ──
  readonly totalQuestions = computed(() => this.quiz().questions.length);
  readonly currentQuestion = computed<SpinWheelQuestion>(
    () => this.quiz().questions[this.questionIndex()] ?? this.quiz().questions[0]
  );
  readonly isLastQuestion = computed(() => this.questionIndex() >= this.totalQuestions() - 1);
  readonly progressPercent = computed(() => {
    const done = this.questionIndex() + (this.revealed() ? 1 : 0);
    return (done / this.totalQuestions()) * 100;
  });

  /**
   * Returns the segment index (0–11) currently under the fixed pointer.
   * rotation = 0 → index 0 (blank) at pointer.
   * rotation = -30 → index 1 (value 0) at pointer.
   */
  readonly selectedIndex = computed(() => {
    const raw =
      ((-this.wheelRotation() / SEGMENT_ANGLE) % SEGMENT_COUNT + SEGMENT_COUNT) % SEGMENT_COUNT;
    return Math.round(raw) % SEGMENT_COUNT;
  });

  /** The numeric value at the pointer. -1 means the blank spacer segment. */
  readonly selectedValue = computed(() => SEGMENT_VALUES[this.selectedIndex()]);

  /** Text shown in the centre circle. */
  readonly centreLabel = computed(() => {
    const v = this.selectedValue();
    return v === -1 ? '' : String(v);
  });

  /** Whether the action button should be enabled. */
  readonly canAct = computed(() => {
    if (this.revealed()) return true;
    return this.selectedValue() >= 0;
  });

  /** CSS styles for the rotating SVG group. */
  readonly wheelGroupStyle = computed((): Record<string, string> => ({
    transform: `rotate(${this.wheelRotation()}deg)`,
    transformOrigin: '50% 50%',
    transformBox: 'view-box',
    transition: this.isDragging()
      ? 'none'
      : `transform var(--f-brand-motion-duration-quick) ${SNAP_SPRING}`,
  }));

  /** Border/background for the post-submit feedback panel. */
  readonly feedbackBoxStyle = computed((): Record<string, string> => {
    if (this.lastPoints() > 0) {
      return {
        background: 'var(--c-correct-bg)',
        borderColor: 'var(--c-correct-border)',
        color: 'var(--c-correct)',
      };
    }
    return {
      background: 'var(--c-error-bg)',
      borderColor: 'var(--c-error-border)',
      color: 'var(--c-error)',
    };
  });

  readonly feedbackTitle = computed(() => {
    const pts = this.lastPoints();
    const q = this.currentQuestion();
    if (pts === 2) return `Exactly right! +2 points`;
    if (pts === 1) return `Close enough! +1 point`;
    return `The answer was ${q.correctAnswer}`;
  });

  readonly actionBtnLabel = computed(() => {
    if (!this.revealed()) return 'Submit answer';
    if (this.isLastQuestion()) return `Finish · ${this.score()}/${this.totalQuestions() * 2}`;
    return 'Next question';
  });

  readonly actionBtnStyle = computed((): Record<string, string> => {
    if (!this.canAct()) {
      return {
        background: 'var(--c-lt-border)',
        color: 'var(--c-lt-text-2)',
        cursor: 'not-allowed',
      };
    }
    return {
      background: 'var(--c-lt-text-1)',
      color: 'var(--c-lt-white)',
      cursor: 'pointer',
    };
  });

  // ── Private drag state ──
  private svgCenter = { x: 0, y: 0 };
  private dragStartAngle = 0;
  private dragStartRotation = 0;

  // ── Private timer handles ──
  private snapFrameId: number | null = null;
  private slideEnterFrameId: number | null = null;
  private slideExitTimeoutId: number | null = null;
  private isAnimating = false;
  private readonly prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const routeQuizId = this.route.snapshot.paramMap.get('quizId');
    const stateQuizId = this.readStateString('quizId');
    const quizId = routeQuizId ?? stateQuizId;
    const resolved =
      SPIN_WHEEL_QUIZZES.find(q => q.id === quizId) ?? SPIN_WHEEL_QUIZZES[0];
    this.quiz.set(resolved);
    this.analytics.track('spin_wheel_quiz_viewed', { quizId: resolved.id });
    this.triggerSlideIn();
  }

  ngOnDestroy(): void {
    if (this.snapFrameId !== null) window.cancelAnimationFrame(this.snapFrameId);
    if (this.slideEnterFrameId !== null) window.cancelAnimationFrame(this.slideEnterFrameId);
    if (this.slideExitTimeoutId !== null) window.clearTimeout(this.slideExitTimeoutId);
  }

  // ── Wheel drag handlers ────────────────────────────────────────────────────

  onWheelPointerDown(event: PointerEvent): void {
    if (this.revealed()) return;
    const target = event.currentTarget as SVGSVGElement;
    const rect = target.getBoundingClientRect();
    this.svgCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    this.dragStartAngle = Math.atan2(
      event.clientY - this.svgCenter.y,
      event.clientX - this.svgCenter.x
    );
    this.dragStartRotation = this.wheelRotation();
    this.isDragging.set(true);
    try {
      target.setPointerCapture(event.pointerId);
    } catch {
      // setPointerCapture may not be available in all environments
    }
    event.preventDefault();
  }

  onWheelPointerMove(event: PointerEvent): void {
    if (!this.isDragging() || this.revealed()) return;
    event.preventDefault();
    const currentAngle = Math.atan2(
      event.clientY - this.svgCenter.y,
      event.clientX - this.svgCenter.x
    );
    const deltaDeg = ((currentAngle - this.dragStartAngle) * 180) / Math.PI;
    this.wheelRotation.set(this.dragStartRotation + deltaDeg);
  }

  onWheelPointerUp(_event: PointerEvent): void {
    if (!this.isDragging()) return;
    this.isDragging.set(false);
    // rAF ensures the transition (re-enabled by isDragging.set(false)) is
    // applied to the DOM before we set the new snapped rotation value.
    if (this.snapFrameId !== null) window.cancelAnimationFrame(this.snapFrameId);
    this.snapFrameId = window.requestAnimationFrame(() => {
      this.snapWheel();
      this.snapFrameId = null;
    });
  }

  /** Keyboard: arrow keys increment/decrement the selected segment index. */
  onWheelKeyDown(event: KeyboardEvent): void {
    if (this.revealed()) return;
    let newIndex: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      newIndex = (this.selectedIndex() + 1) % SEGMENT_COUNT;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      newIndex = (this.selectedIndex() - 1 + SEGMENT_COUNT) % SEGMENT_COUNT;
    }
    if (newIndex !== null) {
      this.wheelRotation.set(-newIndex * SEGMENT_ANGLE);
    }
  }

  // ── Quiz flow handlers ─────────────────────────────────────────────────────

  handleAction(): void {
    if (!this.canAct()) return;
    if (!this.revealed()) {
      this.submitAnswer();
    } else {
      this.handleNext();
    }
  }

  handleBack(): void {
    this.analytics.track('spin_wheel_abandoned', {
      quizId: this.quiz().id,
      qIdx: this.questionIndex(),
    });
    window.history.back();
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  /** Fill colour for a wheel segment based on selection state and value range. */
  segmentFill(seg: WheelSegment): string {
    if (seg.index !== this.selectedIndex() || seg.value < 0) {
      return 'var(--c-lt-bg)';
    }
    const v = seg.value;
    if (v <= 3) return 'var(--c-error)'; // 0–3: unlikely
    if (v <= 7) return 'var(--c-warn)'; // 4–7: neutral
    return 'var(--c-correct)'; // 8–10: likely/high
  }

  segmentTextFill(seg: WheelSegment): string {
    return seg.index === this.selectedIndex() ? 'var(--c-lt-text-1)' : 'var(--c-lt-text-2)';
  }

  segmentTextWeight(seg: WheelSegment): string {
    return seg.index === this.selectedIndex() ? '700' : '400';
  }

  textTransform(seg: WheelSegment): string {
    return `rotate(${seg.textAngle.toFixed(1)} ${seg.textX.toFixed(2)} ${seg.textY.toFixed(2)})`;
  }

  /** Format a float to 2 decimal places for SVG attribute precision. */
  f2(n: number): string {
    return n.toFixed(2);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private submitAnswer(): void {
    const value = this.selectedValue();
    if (value < 0) return;
    const q = this.currentQuestion();
    const pts = this.computePoints(value, q);
    this.lastPoints.set(pts);
    this.score.update(s => s + pts);
    this.revealed.set(true);
    this.analytics.track('spin_wheel_answer', {
      quizId: this.quiz().id,
      qIdx: this.questionIndex(),
      submitted: value,
      correct: q.correctAnswer,
      points: pts,
    });
  }

  private handleNext(): void {
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
    if (this.slideExitTimeoutId !== null) window.clearTimeout(this.slideExitTimeoutId);
    this.slideExitTimeoutId = window.setTimeout(() => {
      this.advanceToNextQuestion();
      this.isAnimating = false;
      this.triggerSlideIn();
      this.slideExitTimeoutId = null;
    }, SLIDE_EXIT_MS);
  }

  private advanceToNextQuestion(): void {
    this.questionIndex.update(v => v + 1);
    this.revealed.set(false);
    this.lastPoints.set(0);
    this.wheelRotation.set(INITIAL_ROTATION);
  }

  /** Snap wheel rotation to the nearest 30° boundary. */
  private snapWheel(): void {
    const snapped = Math.round(this.wheelRotation() / SEGMENT_ANGLE) * SEGMENT_ANGLE;
    this.wheelRotation.set(snapped);
  }

  private computePoints(submitted: number, q: SpinWheelQuestion): number {
    if (submitted === q.correctAnswer) return 2;
    if (Math.abs(submitted - q.correctAnswer) <= q.tolerance) return 1;
    return 0;
  }

  private finishQuiz(): void {
    const finalScore = this.score();
    const total = this.totalQuestions() * 2;
    const quiz = this.quiz();
    this.store.addPoints(finalScore);
    this.store.recordQuizResult(quiz.id, finalScore, total);
    if (this.isFlowId(quiz.id)) {
      this.store.completeFlow(quiz.id);
    }
    this.analytics.track('spin_wheel_completed', {
      quizId: quiz.id,
      score: finalScore,
      total,
    });
    void this.router.navigate(['/results'], {
      state: { score: finalScore, total, quizTitle: quiz.title },
    });
  }

  private triggerSlideIn(): void {
    if (this.prefersReducedMotion) {
      this.slideStyle.set({ transform: 'translateX(0)', opacity: '1', transition: 'none' });
      return;
    }
    if (this.slideEnterFrameId !== null) window.cancelAnimationFrame(this.slideEnterFrameId);
    this.slideStyle.set({ transform: 'translateX(60px)', opacity: '0', transition: 'none' });
    // Double rAF ensures Angular has committed the off-screen position before
    // the transition fires — mirrors the pattern used in quiz.page.ts.
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

  private isFlowId(value: string): value is FlowId {
    return (FLOW_IDS as readonly string[]).includes(value);
  }

  private readStateString(key: string): string | null {
    const state = window.history.state as Record<string, unknown> | null;
    const value = state?.[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
