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

import { CARD_MATCH_QUIZZES, type CardMatchPair } from '../data/cardMatchQuizzes';
import { WORLD_CUP_TEAMS } from '../data/teams';
import { FLOW_IDS, type FlowId } from '../models/flow-id.model';
import { AnalyticsService } from '../services/analytics.service';
import { StoreService } from '../services/store.service';

interface MatchCard {
  id: string;
  pairId: string;
  type: 'flag' | 'name' | 'clue' | 'answer';
  display: string;
}

type CardStatus = 'hidden' | 'flipped' | 'matched' | 'mismatched';

interface ConfettiParticle {
  id: number;
  left: string;
  delay: string;
  duration: string;
  color: string;
  size: string;
  rotation: number;
  rounded: boolean;
}

const LEGACY_PAIR_COUNT = 3;
const LEGACY_ROUND_TIME = 30;
const FLOW_PAIR_COUNT = 3;
const FLOW_ROUND_TIME = 45;
const FLIP_DURATION = 400;
const MISMATCH_DELAY = 800;
const MATCH_DELAY = 500;
const DEAL_STAGGER = 60;

const CARD_MATCH_KEYFRAMES = `
@keyframes card-shake {
  0%, 100% { transform: rotateY(180deg) translateX(0); }
  20% { transform: rotateY(180deg) translateX(-6px); }
  40% { transform: rotateY(180deg) translateX(6px); }
  60% { transform: rotateY(180deg) translateX(-4px); }
  80% { transform: rotateY(180deg) translateX(3px); }
}
@keyframes card-match-pop {
  0% { transform: rotateY(180deg) scale(1); }
  40% { transform: rotateY(180deg) scale(1.08); }
  100% { transform: rotateY(180deg) scale(1); }
}
@keyframes shimmer-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
@keyframes match-ring {
  0% { transform: scale(0.6); opacity: 1; }
  100% { transform: scale(1.8); opacity: 0; }
}
@keyframes confetti-fall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(60px) rotate(360deg); opacity: 0; }
}
@keyframes stat-count-in {
  0% { transform: translateY(8px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes card-press {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

.card-match-card-button:active:not(:disabled) {
  animation: card-press var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
}

.card-match-inner--mismatched {
  animation: card-shake var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit) !important;
}

.card-match-inner--matched {
  animation: card-match-pop var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit) !important;
}

.card-match-ring {
  animation: match-ring var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit) forwards !important;
}

.card-match-shimmer {
  animation: shimmer-slide 3s ease-in-out infinite !important;
}

.card-match-confetti-particle {
  animation-name: confetti-fall !important;
  animation-timing-function: var(--f-brand-motion-easing-exit);
  animation-fill-mode: forwards;
}

.card-match-stat--visible {
  animation: stat-count-in var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit) both !important;
}

@media (prefers-reduced-motion: reduce) {
  .card-match-page, .card-match-page * {
    animation: none !important;
    transition-duration: 1ms !important;
  }
}
`;

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <main
      class="card-match-page"
      data-page="card-match"
      style="
        position: fixed;
        inset: 0;
        background: var(--f-brand-color-background-default);
        color: var(--f-brand-color-text-default);
        display: flex;
        flex-direction: column;
        overflow: auto;
        -webkit-overflow-scrolling: touch;
      "
    >
      <section
        class="card-match__content f-page-enter"
        style="
          flex: 1;
          width: 100%;
          max-width: 420px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          padding: var(--f-brand-space-md);
        "
      >
        <header
          class="card-match__header"
          data-section="header"
          style="
            display: flex;
            align-items: center;
            gap: var(--f-brand-space-sm);
            margin-bottom: var(--f-brand-space-lg);
          "
        >
          <button
            class="card-match__back-btn"
            type="button"
            data-ui="back-btn"
            aria-label="Go back"
            (click)="handleBack()"
            style="
              width: var(--sp-12);
              height: var(--sp-12);
              border-radius: var(--f-brand-radius-rounded);
              border: var(--f-brand-border-size-default) solid var(--f-brand-color-border-default);
              background: var(--f-brand-color-background-light);
              color: var(--f-brand-color-text-default);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px var(--f-brand-shadow-medium);
              padding: 0;
              cursor: pointer;
              flex-shrink: 0;
              -webkit-tap-highlight-color: transparent;
            "
          >
            <svg class="card-match__back-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                class="card-match__back-icon-path"
                d="M15 18.5C14.87 18.5 14.74 18.45 14.65 18.35L8.65 12.35C8.55 12.26 8.5 12.13 8.5 12C8.5 11.87 8.55 11.74 8.65 11.65L14.65 5.65C14.84 5.46 15.16 5.46 15.35 5.65C15.54 5.84 15.54 6.16 15.35 6.35L9.71 12L15.35 17.65C15.54 17.84 15.54 18.16 15.35 18.35C15.26 18.45 15.13 18.5 15 18.5Z"
                fill="var(--f-brand-color-text-default)"
              />
            </svg>
          </button>
          <div
            class="card-match__progress-track"
            style="
              flex: 1;
              height: var(--sp-2);
              border-radius: var(--f-brand-radius-rounded);
              background: var(--f-brand-color-border-default);
              overflow: hidden;
            "
          >
            <div
              class="card-match__progress-fill"
              [style.width.%]="progressPercent()"
              style="
                height: 100%;
                border-radius: var(--f-brand-radius-rounded);
                background: linear-gradient(
                  90deg,
                  var(--f-brand-color-accent),
                  var(--f-brand-color-background-success)
                );
                transition: width var(--f-brand-motion-duration-quick)
                  var(--f-brand-motion-easing-exit);
              "
            ></div>
          </div>
        </header>

        <h1
          class="card-match__title"
          data-section="title"
          style="
            margin: 0;
            text-align: center;
            font: var(--f-brand-type-title-3);
            color: var(--f-brand-color-text-default);
            letter-spacing: var(--tracking-tight);
            margin-bottom: {{ activeQuiz() ? 'var(--f-brand-space-xs)' : 'var(--f-brand-space-lg)' }};
          "
        >
          {{ pageTitle() }}
        </h1>
        @if (activeQuiz(); as quiz) {
          <p
            class="card-match__round-label"
            style="
              margin: 0 0 var(--f-brand-space-md);
              text-align: center;
              font: var(--f-brand-type-caption);
              color: var(--f-brand-color-text-subtle);
            "
          >
            Round {{ currentRound() + 1 }} of {{ totalRounds() }} · {{ activeRoundTitle() }}
          </p>
        }

        <div
          class="card-match__grid"
          data-section="card-grid"
          style="
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat({{ pairCount() }}, auto);
            gap: var(--f-brand-space-sm);
            margin-bottom: var(--f-brand-space-lg);
          "
        >
          @for (card of deck(); track card.id) {
            <button
              class="card-match-card-button"
              type="button"
              data-section="card-item"
              [disabled]="cardButtonDisabled(card.id)"
              [attr.aria-label]="cardAriaLabel(card.id)"
              (click)="flipCard(card.id)"
              [ngStyle]="cardOuterStyle(card.id)"
            >
              <div class="card-match__card-inner" [ngStyle]="cardInnerStyle(card.id)"
                   [class.card-match-inner--matched]="isMatched(card.id)"
                   [class.card-match-inner--mismatched]="isMismatched(card.id)">
                <div class="card-match__card-back" [ngStyle]="cardBackStyle()">
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 170 160"
                    style="position: absolute; inset: 0; opacity: 0.15"
                    preserveAspectRatio="xMidYMid slice"
                    aria-hidden="true"
                  >
                    <defs>
                      <pattern
                        [attr.id]="patternId(card.id)"
                        x="0"
                        y="0"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                      >
                        <circle cx="20" cy="20" r="12" fill="none" stroke="white" stroke-width="0.8" />
                        <circle cx="0" cy="0" r="8" fill="none" stroke="white" stroke-width="0.5" />
                        <circle cx="40" cy="0" r="8" fill="none" stroke="white" stroke-width="0.5" />
                        <circle cx="0" cy="40" r="8" fill="none" stroke="white" stroke-width="0.5" />
                        <circle cx="40" cy="40" r="8" fill="none" stroke="white" stroke-width="0.5" />
                        <path d="M20 8L20 32M8 20L32 20" stroke="white" stroke-width="0.4" />
                      </pattern>
                    </defs>
                    <rect width="170" height="160" [attr.fill]="'url(#' + patternId(card.id) + ')'" />
                  </svg>
                  <div class="card-match-shimmer" [ngStyle]="cardBackShimmerStyle()"></div>
                </div>
                <div class="card-match__card-front" [ngStyle]="cardFrontStyle(card.id)">
                  @if (card.type === 'flag') {
                    <span class="card-match__card-flag" [ngStyle]="flagTextStyle()">{{ card.display }}</span>
                  } @else if (card.type === 'clue') {
                    <span class="card-match__card-clue" [ngStyle]="clueTextStyle()">{{ card.display }}</span>
                  } @else {
                    <span class="card-match__card-answer" [ngStyle]="answerTextStyle()">{{ card.display }}</span>
                  }

                  @if (isMatched(card.id)) {
                    <div
                      class="card-match__checkmark"
                      style="
                        position: absolute;
                        top: var(--f-brand-space-2xs);
                        right: var(--f-brand-space-2xs);
                        width: var(--sp-5);
                        height: var(--sp-5);
                        border-radius: var(--f-brand-radius-rounded);
                        background: var(--f-brand-color-background-success);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                      "
                    >
                      <svg class="card-match__checkmark-icon" width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="white"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </div>
                  }
                </div>
              </div>

              @if (showMatchRing(card.id)) {
                <div class="card-match-ring" [ngStyle]="matchRingStyle()"></div>
              }
            </button>
          }
        </div>

        <div
          class="card-match-stats-row"
          style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--f-brand-space-lg);
            margin-bottom: var(--f-brand-space-lg);
          "
        >
          <div class="card-match__stat-matched" style="text-align: center; min-width: var(--sp-12)">
            <p
              class="card-match__stat-value"
              style="
                margin: 0;
                font: var(--f-brand-type-headline-medium);
                transition: color var(--f-brand-motion-duration-instant)
                  var(--f-brand-motion-easing-default);
              "
              [style.color]="
                matchedPairs() > 0
                  ? 'var(--f-brand-color-background-success)'
                  : 'var(--f-brand-color-text-default)'
              "
            >
              {{ matchedPairs() }}/{{ pairCount() }}
            </p>
            <p
              class="card-match__stat-label"
              style="
                margin: var(--f-brand-border-size-focused) 0 0;
                font: var(--f-brand-type-caption);
                color: var(--f-brand-color-text-subtle);
                letter-spacing: var(--tracking-wider);
                text-transform: uppercase;
              "
            >
              Matched
            </p>
          </div>
          <div class="card-match__timer" style="position: relative; width: 48px; height: 48px">
            <svg class="card-match__timer-svg" [attr.width]="timerSize" [attr.height]="timerSize" style="transform: rotate(-90deg)" aria-hidden="true">
              <circle
                class="card-match__timer-track"
                [attr.cx]="timerSize / 2"
                [attr.cy]="timerSize / 2"
                [attr.r]="timerRadius"
                fill="none"
                stroke="var(--f-brand-color-border-default)"
                [attr.stroke-width]="timerStrokeWidth"
              />
              <circle
                class="card-match__timer-progress"
                [attr.cx]="timerSize / 2"
                [attr.cy]="timerSize / 2"
                [attr.r]="timerRadius"
                fill="none"
                stroke="var(--f-brand-color-primary)"
                [attr.stroke-width]="timerStrokeWidth"
                [attr.stroke-dasharray]="timerCircumference"
                [attr.stroke-dashoffset]="timerDashOffset()"
                stroke-linecap="round"
                style="transition: stroke-dashoffset var(--f-brand-motion-duration-generous) linear"
              />
            </svg>
            <span
              class="card-match__timer-text"
              style="
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font: var(--f-brand-type-body-medium);
                color: var(--f-brand-color-text-default);
              "
            >
              {{ formatTime(timeLeft()) }}
            </span>
          </div>
          <div class="card-match__stat-moves" style="text-align: center; min-width: var(--sp-12)">
            <p
              class="card-match__stat-value"
              style="
                margin: 0;
                font: var(--f-brand-type-headline-medium);
                color: var(--f-brand-color-text-default);
              "
            >
              {{ moves() }}
            </p>
            <p
              class="card-match__stat-label"
              style="
                margin: var(--f-brand-border-size-focused) 0 0;
                font: var(--f-brand-type-caption);
                color: var(--f-brand-color-text-subtle);
                letter-spacing: var(--tracking-wider);
                text-transform: uppercase;
              "
            >
              Moves
            </p>
          </div>
        </div>

        <button
          class="card-match__next-btn"
          type="button"
          (click)="goToResults()"
          style="
            margin-top: auto;
            width: 100%;
            min-height: var(--sp-14);
            border: none;
            border-radius: var(--f-brand-radius-rounded);
            background: var(--f-brand-color-primary);
            color: var(--f-brand-color-text-light);
            font: var(--f-brand-type-body-medium);
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
          "
        >
          Next
        </button>
      </section>

      @if (showCompletion()) {
        <section
          class="card-match__completion-overlay"
          [ngStyle]="completionOverlayStyle()"
        >
          <div class="card-match__completion-card" [ngStyle]="completionCardStyle()">
            @if (completionVisible() && stars() >= 2) {
              <div class="card-match__confetti" style="position: absolute; inset: 0; overflow: hidden; pointer-events: none">
                @for (particle of confettiParticles(); track particle.id) {
                  <div class="card-match-confetti-particle" [ngStyle]="confettiParticleStyle(particle)"></div>
                }
              </div>
            }

            <div
              class="card-match__stars"
              style="
                font-size: var(--text-3xl);
                margin-bottom: var(--f-brand-space-md);
                letter-spacing: var(--tracking-display-ultra);
              "
            >
              @for (slot of starSlots; track slot) {
                <span class="card-match__star" [ngStyle]="starStyle(slot)">⭐</span>
              }
            </div>

            <h2
              class="card-match__completion-heading"
              style="
                margin: 0 0 var(--f-brand-space-xs);
                font: var(--f-brand-type-title-3);
                color: var(--f-brand-color-text-default);
                letter-spacing: var(--tracking-tight);
              "
            >
              {{ completionHeading() }}
            </h2>
            <p
              class="card-match__completion-desc"
              style="
                margin: 0 0 var(--f-brand-space-lg);
                font-size: var(--text-sm);
                color: var(--f-brand-color-text-subtle);
                line-height: var(--leading-normal);
              "
            >
              {{ completionDescription() }}
            </p>

            <div
              class="card-match__completion-stats"
              style="
                display: flex;
                justify-content: center;
                gap: var(--f-brand-space-lg);
                margin-bottom: var(--f-brand-space-xl);
              "
            >
              <div class="card-match__completion-stat" style="text-align: center">
                <div [ngStyle]="animatedStatStyle(showMovesStat())" [class.card-match-stat--visible]="showMovesStat()">{{ accumulatedMoves() }}</div>
                <div
                  class="card-match__completion-stat-label"
                  style="
                    margin-top: 2px;
                    font-size: var(--text-2xs);
                    color: var(--f-brand-color-text-subtle);
                    letter-spacing: var(--tracking-wider);
                    text-transform: uppercase;
                  "
                >
                  Moves
                </div>
              </div>
              <div class="card-match__completion-divider" style="width: 1px; background: var(--f-brand-color-border-default)"></div>
              <div class="card-match__completion-stat" style="text-align: center">
                <div [ngStyle]="animatedStatStyle(showTimeStat())" [class.card-match-stat--visible]="showTimeStat()">{{ accumulatedTimeUsed() }}s</div>
                <div
                  class="card-match__completion-stat-label"
                  style="
                    margin-top: 2px;
                    font-size: var(--text-2xs);
                    color: var(--f-brand-color-text-subtle);
                    letter-spacing: var(--tracking-wider);
                    text-transform: uppercase;
                  "
                >
                  Time
                </div>
              </div>
            </div>

            <button
              class="card-match__results-btn"
              type="button"
              (click)="goToResults()"
              style="
                width: 100%;
                height: var(--sp-14);
                border: none;
                border-radius: var(--f-brand-radius-rounded);
                background: var(--f-brand-color-primary);
                color: var(--f-brand-color-text-light);
                font: var(--f-brand-type-body-medium);
                cursor: pointer;
                margin-bottom: var(--f-brand-space-sm);
              "
            >
              View Results
            </button>
            <button
              class="card-match__play-again-btn"
              type="button"
              (click)="handlePlayAgain()"
              style="
                width: 100%;
                height: var(--sp-14);
                border: var(--f-brand-border-size-default) solid var(--f-brand-color-border-default);
                border-radius: var(--f-brand-radius-rounded);
                background: var(--f-brand-color-background-light);
                color: var(--f-brand-color-text-default);
                font: var(--f-brand-type-body-medium);
                cursor: pointer;
              "
            >
              Play Again
            </button>
          </div>
        </section>
      }
    </main>
  `,
  styles: [CARD_MATCH_KEYFRAMES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardMatchPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(StoreService);
  private readonly analytics = inject(AnalyticsService);

  readonly activeQuiz = signal<(typeof CARD_MATCH_QUIZZES)[number] | null>(null);
  readonly currentRound = signal(0);
  readonly accumulatedScore = signal(0);
  readonly accumulatedMoves = signal(0);
  readonly accumulatedTimeUsed = signal(0);

  readonly deck = signal<MatchCard[]>([]);
  readonly statuses = signal<Record<string, CardStatus>>({});
  readonly flippedIds = signal<string[]>([]);
  readonly dealtCardIds = signal<Record<string, boolean>>({});
  readonly matchRingVisible = signal<Record<string, boolean>>({});
  readonly moves = signal(0);
  readonly matchedPairs = signal(0);
  readonly timeLeft = signal(LEGACY_ROUND_TIME);
  readonly gameComplete = signal(false);
  readonly showCompletion = signal(false);
  readonly completionVisible = signal(false);
  readonly showMovesStat = signal(false);
  readonly showTimeStat = signal(false);
  readonly confettiParticles = signal<ConfettiParticle[]>([]);
  readonly started = signal(false);
  readonly lockInput = signal(false);

  readonly starSlots = [1, 2, 3] as const;
  readonly timerSize = 48;
  readonly timerStrokeWidth = 4;
  readonly timerRadius = (this.timerSize - this.timerStrokeWidth) / 2;
  readonly timerCircumference = 2 * Math.PI * this.timerRadius;

  readonly pairCount = computed(() => (this.activeQuiz() ? FLOW_PAIR_COUNT : LEGACY_PAIR_COUNT));
  readonly roundTime = computed(() => (this.activeQuiz() ? FLOW_ROUND_TIME : LEGACY_ROUND_TIME));
  readonly totalRounds = computed(() => this.activeQuiz()?.rounds.length ?? 1);
  readonly pageTitle = computed(() => this.activeQuiz()?.title ?? 'Match the cards');
  readonly activeRoundTitle = computed(
    () => this.activeQuiz()?.rounds[this.currentRound()]?.title ?? '',
  );
  readonly timerDashOffset = computed(() => {
    const total = this.roundTime();
    if (total <= 0) return this.timerCircumference;
    const progress = this.timeLeft() / total;
    return this.timerCircumference * (1 - progress);
  });
  readonly stars = computed(() => this.getStars());
  readonly progressPercent = computed(() => {
    const current = this.currentRound();
    const rounds = this.totalRounds();
    const localProgress = this.matchedPairs() / this.pairCount();
    if (rounds <= 1) return localProgress * 100;
    return ((current + localProgress) / rounds) * 100;
  });

  private timerId: number | null = null;
  private readonly scheduledTimeoutIds = new Set<number>();

  ngOnInit(): void {
    const routeQuizId = this.route.snapshot.paramMap.get('quizId');
    const stateFlowId = this.readStateString('flowId');
    const stateQuizId = this.readStateString('quizId');
    const requestedId = routeQuizId ?? stateFlowId ?? stateQuizId;
    const quiz = CARD_MATCH_QUIZZES.find(entry => entry.id === requestedId) ?? null;
    this.activeQuiz.set(quiz);
    this.setupRound(0);
    this.analytics.track('card_match_viewed', { flowId: requestedId ?? 'card-match' });
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.clearScheduledTimeouts();
  }

  flipCard(cardId: string): void {
    if (this.lockInput() || this.gameComplete()) return;
    if (this.statuses()[cardId] !== 'hidden') return;

    if (!this.started()) {
      this.started.set(true);
      this.startTimer();
    }

    const card = this.deck().find(item => item.id === cardId);
    if (!card) return;

    this.statuses.update(prev => ({ ...prev, [cardId]: 'flipped' }));
    const nextFlipped = [...this.flippedIds(), cardId];
    this.flippedIds.set(nextFlipped);
    this.analytics.track('card_match_flip', { cardId, pairId: card.pairId });

    if (nextFlipped.length !== 2) return;

    this.moves.update(value => value + 1);
    this.lockInput.set(true);
    const first = this.deck().find(item => item.id === nextFlipped[0]);
    const second = this.deck().find(item => item.id === nextFlipped[1]);
    if (!first || !second) {
      this.lockInput.set(false);
      return;
    }

    if (first.pairId === second.pairId) {
      this.scheduleTimeout(() => {
        this.statuses.update(prev => ({
          ...prev,
          [nextFlipped[0]]: 'matched',
          [nextFlipped[1]]: 'matched',
        }));
        this.triggerMatchRing(nextFlipped);
        this.flippedIds.set([]);
        this.lockInput.set(false);
        this.matchedPairs.update(value => value + 1);
        this.analytics.track('card_match_pair_found', { pairId: first.pairId });
        if (this.matchedPairs() >= this.pairCount()) {
          this.completeCurrentRound();
        }
      }, MATCH_DELAY);
      return;
    }

    this.scheduleTimeout(() => {
      this.statuses.update(prev => ({
        ...prev,
        [nextFlipped[0]]: 'mismatched',
        [nextFlipped[1]]: 'mismatched',
      }));
      this.scheduleTimeout(() => {
        this.statuses.update(prev => ({
          ...prev,
          [nextFlipped[0]]: 'hidden',
          [nextFlipped[1]]: 'hidden',
        }));
        this.flippedIds.set([]);
        this.lockInput.set(false);
      }, 500);
    }, MISMATCH_DELAY);
  }

  handleBack(): void {
    this.analytics.track('card_match_abandoned', {
      moves: this.moves(),
      timeLeft: this.timeLeft(),
      matchedPairs: this.matchedPairs(),
      flowId: this.activeQuiz()?.id ?? 'card-match',
    });
    window.history.back();
  }

  handlePlayAgain(): void {
    this.accumulatedScore.set(0);
    this.accumulatedMoves.set(0);
    this.accumulatedTimeUsed.set(0);
    this.showCompletion.set(false);
    this.completionVisible.set(false);
    this.showMovesStat.set(false);
    this.showTimeStat.set(false);
    this.confettiParticles.set([]);
    this.setupRound(0);
    this.analytics.track('card_match_play_again', { flowId: this.activeQuiz()?.id ?? 'card-match' });
  }

  cardButtonDisabled(cardId: string): boolean {
    return this.statuses()[cardId] !== 'hidden' || this.gameComplete() || this.lockInput();
  }

  cardAriaLabel(cardId: string): string {
    const status = this.statuses()[cardId] ?? 'hidden';
    const isFlipped = status === 'flipped' || status === 'matched';
    const card = this.deck().find(entry => entry.id === cardId);
    return isFlipped && card ? card.display : 'Hidden card';
  }

  patternId(cardId: string): string {
    return `card-pattern-${cardId}`;
  }

  isMatched(cardId: string): boolean {
    return (this.statuses()[cardId] ?? 'hidden') === 'matched';
  }

  showMatchRing(cardId: string): boolean {
    return this.matchRingVisible()[cardId] === true;
  }

  formatTime(value: number): string {
    return String(Math.max(value, 0)).padStart(2, '0');
  }

  completionHeading(): string {
    const stars = this.stars();
    if (stars === 3) return 'Perfect!';
    if (stars === 2) return 'Great Job!';
    return 'Well Done!';
  }

  completionDescription(): string {
    const rounds = this.totalRounds();
    return `You matched all ${this.pairCount()} pairs${rounds > 1 ? ` across ${rounds} rounds` : ''}`;
  }

  cardOuterStyle(cardId: string): Record<string, string> {
    const dealt = this.dealtCardIds()[cardId] === true;
    return {
      position: 'relative',
      width: '100%',
      aspectRatio: '170 / 160',
      perspective: '600px',
      background: 'none',
      padding: '0',
      border: 'none',
      WebkitTapHighlightColor: 'transparent',
      opacity: dealt ? '1' : '0',
      transform: dealt ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.85)',
      transition:
        'opacity var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit), transform var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit)',
      cursor: this.statuses()[cardId] === 'hidden' ? 'pointer' : 'default',
    };
  }

  cardInnerStyle(cardId: string): Record<string, string> {
    const status = this.statuses()[cardId] ?? 'hidden';
    const flipped = status === 'flipped' || status === 'matched';
    const mismatched = status === 'mismatched';
    return {
      position: 'relative',
      width: '100%',
      height: '100%',
      transformStyle: 'preserve-3d',
      transform: flipped || mismatched ? 'rotateY(180deg)' : 'rotateY(0deg)',
      transition: `transform ${FLIP_DURATION}ms var(--f-brand-motion-easing-exit)`,
    };
  }

  isMismatched(cardId: string): boolean {
    return (this.statuses()[cardId] ?? 'hidden') === 'mismatched';
  }

  cardBackStyle(): Record<string, string> {
    return {
      position: 'absolute',
      inset: '0',
      borderRadius: 'var(--f-brand-radius-small)',
      background: 'var(--f-brand-color-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backfaceVisibility: 'hidden',
      overflow: 'hidden',
    };
  }

  cardBackShimmerStyle(): Record<string, string> {
    return {
      position: 'absolute',
      inset: '0',
      background:
        'linear-gradient(105deg, transparent 40%, var(--c-lt-shimmer) 50%, transparent 60%)',
    };
  }

  cardFrontStyle(cardId: string): Record<string, string> {
    const status = this.statuses()[cardId] ?? 'hidden';
    const matched = status === 'matched';
    const mismatch = status === 'mismatched';
    return {
      position: 'absolute',
      inset: '0',
      borderRadius: 'var(--f-brand-radius-small)',
      background: matched
        ? 'var(--f-brand-color-background-success-accent)'
        : 'var(--f-brand-color-background-light)',
      border: `var(--f-brand-border-size-default) solid ${
        matched
          ? 'var(--f-brand-color-background-success)'
          : mismatch
            ? 'var(--f-brand-color-status-error)'
            : 'var(--f-brand-color-border-default)'
      }`,
      backfaceVisibility: 'hidden',
      transform: 'rotateY(180deg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--f-brand-space-2xs)',
      textAlign: 'center',
      padding: 'var(--f-brand-space-xs)',
      boxShadow: matched
        ? 'var(--c-glow-success-md)'
        : mismatch
          ? 'var(--c-glow-error-md)'
          : 'var(--f-brand-shadow-medium)',
      transition:
        'box-shadow var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
      overflow: 'hidden',
    };
  }

  flagTextStyle(): Record<string, string> {
    return {
      fontSize: 'var(--text-3xl)',
      lineHeight: 'var(--leading-none)',
    };
  }

  clueTextStyle(): Record<string, string> {
    return {
      font: 'var(--f-brand-type-caption)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--f-brand-color-text-subtle)',
      textAlign: 'center',
      lineHeight: 'var(--leading-relaxed)',
      letterSpacing: 'var(--tracking-snug)',
    };
  }

  answerTextStyle(): Record<string, string> {
    return {
      font: 'var(--f-brand-type-caption-medium)',
      color: 'var(--f-brand-color-text-default)',
      textAlign: 'center',
      lineHeight: 'var(--leading-snug)',
      letterSpacing: 'var(--tracking-snug)',
    };
  }

  matchRingStyle(): Record<string, string> {
    return {
      position: 'absolute',
      inset: '-8px',
      borderRadius: 'var(--f-brand-radius-inner)',
      border: 'var(--f-brand-border-size-focused) solid var(--f-brand-color-background-success)',
      pointerEvents: 'none',
    };
  }

  completionOverlayStyle(): Record<string, string> {
    const visible = this.completionVisible();
    return {
      position: 'fixed',
      inset: '0',
      zIndex: '100',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: visible ? 'var(--f-brand-color-background-dark-50a)' : 'transparent',
      backdropFilter: visible ? 'blur(var(--f-brand-blur-subtle))' : 'none',
      WebkitBackdropFilter: visible ? 'blur(var(--f-brand-blur-subtle))' : 'none',
      transition:
        'background var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default), backdrop-filter var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default)',
      padding: 'var(--f-brand-space-lg)',
    };
  }

  completionCardStyle(): Record<string, string> {
    const visible = this.completionVisible();
    return {
      position: 'relative',
      width: '100%',
      maxWidth: 'var(--c-card-match-completion-max-width)',
      background: 'var(--f-brand-color-background-light)',
      border: '1px solid var(--f-brand-color-border-default)',
      borderRadius: 'var(--f-brand-radius-outer)',
      padding: 'var(--f-brand-space-xl) var(--f-brand-space-lg)',
      textAlign: 'center',
      opacity: visible ? '1' : '0',
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
      transition:
        'opacity var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit) var(--f-brand-motion-duration-instant), transform var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit) var(--f-brand-motion-duration-instant)',
      overflow: 'hidden',
    };
  }

  starStyle(slot: number): Record<string, string> {
    const active = slot <= this.stars();
    const visible = this.completionVisible();
    const delay = 300 + slot * 180;
    return {
      opacity: active ? '1' : '0.2',
      filter: active ? 'drop-shadow(var(--c-glow-success))' : 'none',
      display: 'inline-block',
      transform: visible && active ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-30deg)',
      transition:
        `transform var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit) ${delay}ms, ` +
        `opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default) ${delay}ms`,
    };
  }

  animatedStatStyle(visible: boolean): Record<string, string> {
    return {
      font: 'var(--f-brand-type-headline-medium)',
      color: 'var(--f-brand-color-primary)',
      opacity: visible ? '1' : '0',
      transform: visible ? 'translateY(0)' : 'translateY(8px)',
    };
  }

  confettiParticleStyle(particle: ConfettiParticle): Record<string, string> {
    return {
      position: 'absolute',
      top: '-8px',
      left: particle.left,
      width: particle.size,
      height: particle.size,
      borderRadius: particle.rounded ? 'var(--f-brand-radius-rounded)' : '0',
      background: particle.color,
      animationDuration: particle.duration,
      animationDelay: particle.delay,
      transform: `rotate(${particle.rotation}deg)`,
    };
  }

  goToResults(): void {
    const quiz = this.activeQuiz();
    const quizId = quiz?.id ?? 'card-match';
    const total = this.pairCount() * this.totalRounds();
    const score = this.accumulatedScore();
    const title = quiz?.title ?? 'Card match';
    void this.router.navigate(['/results'], {
      state: { score, total, quizTitle: title, quizId },
    });
  }

  private setupRound(roundIndex: number): void {
    this.clearScheduledTimeouts();
    const quiz = this.activeQuiz();
    const roundPairs = quiz ? quiz.rounds[roundIndex]?.pairs ?? [] : [];
    const nextDeck = quiz
      ? this.buildFlowDeck(roundPairs, this.pairCount())
      : this.buildLegacyDeck(this.pairCount());
    this.currentRound.set(roundIndex);
    this.deck.set(nextDeck);
    this.statuses.set(this.initStatuses(nextDeck));
    this.flippedIds.set([]);
    this.moves.set(0);
    this.matchedPairs.set(0);
    this.timeLeft.set(this.roundTime());
    this.started.set(false);
    this.gameComplete.set(false);
    this.lockInput.set(false);
    this.matchRingVisible.set({});
    this.stopTimer();
    this.queueDealIn(nextDeck);
  }

  private completeCurrentRound(): void {
    if (this.gameComplete()) return;
    this.stopTimer();
    this.gameComplete.set(true);
    const roundScore = this.calculateScore(this.moves(), this.matchedPairs(), this.timeLeft(), this.pairCount());
    const nextScore = this.accumulatedScore() + roundScore;
    const totalMoves = this.accumulatedMoves() + this.moves();
    const timeUsed = this.accumulatedTimeUsed() + (this.roundTime() - this.timeLeft());
    this.accumulatedScore.set(nextScore);
    this.accumulatedMoves.set(totalMoves);
    this.accumulatedTimeUsed.set(timeUsed);

    const quiz = this.activeQuiz();
    if (quiz && this.currentRound() < this.totalRounds() - 1) {
      this.scheduleTimeout(() => this.setupRound(this.currentRound() + 1), 800);
      return;
    }

    const quizId = quiz?.id ?? 'card-match';
    this.store.addPoints(nextScore);
    this.store.recordQuizResult(quizId, nextScore, this.pairCount() * this.totalRounds());
    if (quiz && this.isFlowId(quiz.id)) {
      this.store.completeFlow(quiz.id);
    }
    this.analytics.track('card_match_completed', {
      flowId: quizId,
      score: nextScore,
      moves: totalMoves,
      timeUsed,
    });
    this.triggerCompletionEntrance();
    this.showCompletion.set(true);
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = window.setInterval(() => {
      const next = this.timeLeft() - 1;
      this.timeLeft.set(Math.max(next, 0));
      if (next <= 0) {
        this.completeCurrentRound();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private triggerCompletionEntrance(): void {
    this.completionVisible.set(false);
    this.showMovesStat.set(false);
    this.showTimeStat.set(false);
    this.confettiParticles.set(this.buildConfettiParticles());
    this.scheduleTimeout(() => this.completionVisible.set(true), 100);
    this.scheduleTimeout(() => this.showMovesStat.set(true), 700);
    this.scheduleTimeout(() => this.showTimeStat.set(true), 900);
  }

  private queueDealIn(deck: MatchCard[]): void {
    const hiddenState: Record<string, boolean> = {};
    for (const card of deck) {
      hiddenState[card.id] = false;
    }
    this.dealtCardIds.set(hiddenState);
    deck.forEach((card, index) => {
      this.scheduleTimeout(() => {
        this.dealtCardIds.update(prev => ({ ...prev, [card.id]: true }));
      }, index * DEAL_STAGGER);
    });
  }

  private triggerMatchRing(cardIds: string[]): void {
    this.matchRingVisible.update(prev => {
      const next = { ...prev };
      for (const cardId of cardIds) {
        next[cardId] = true;
      }
      return next;
    });
    this.scheduleTimeout(() => {
      this.matchRingVisible.update(prev => {
        const next = { ...prev };
        for (const cardId of cardIds) {
          delete next[cardId];
        }
        return next;
      });
    }, 600);
  }

  private scheduleTimeout(callback: () => void, delayMs: number): number {
    const timeoutId = window.setTimeout(() => {
      this.scheduledTimeoutIds.delete(timeoutId);
      callback();
    }, delayMs);
    this.scheduledTimeoutIds.add(timeoutId);
    return timeoutId;
  }

  private clearScheduledTimeouts(): void {
    for (const timeoutId of this.scheduledTimeoutIds) {
      window.clearTimeout(timeoutId);
    }
    this.scheduledTimeoutIds.clear();
  }

  private calculateScore(moves: number, matched: number, timeLeft: number, pairCount: number): number {
    if (matched === 0) return 0;
    const matchBonus = matched * 2;
    const moveScore = Math.max(0, pairCount - Math.max(0, moves - pairCount));
    const timeBonus = timeLeft >= 20 ? 2 : timeLeft >= 10 ? 1 : 0;
    return matchBonus + moveScore + timeBonus;
  }

  private getStars(): number {
    if (this.matchedPairs() < this.pairCount()) return 1;
    if (this.moves() <= this.pairCount() + 2) return 3;
    if (this.moves() <= this.pairCount() + 6) return 2;
    return 1;
  }

  private buildConfettiParticles(): ConfettiParticle[] {
    const colors = [
      'var(--f-brand-color-background-success)',
      'var(--f-brand-color-primary)',
      'var(--f-brand-color-status-warning)',
      'var(--f-brand-color-accent)',
    ];
    return Array.from({ length: 20 }, (_, index) => ({
      id: index,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 600}ms`,
      duration: `${800 + Math.random() * 600}ms`,
      color: colors[index % colors.length],
      size: `${4 + Math.random() * 4}px`,
      rotation: Math.random() * 360,
      rounded: index % 3 === 0,
    }));
  }

  private buildLegacyDeck(pairCount: number): MatchCard[] {
    const selectedTeams = this.shuffle([...WORLD_CUP_TEAMS]).slice(0, pairCount);
    const cards: MatchCard[] = [];
    for (const team of selectedTeams) {
      cards.push({
        id: `${team.id}-flag`,
        pairId: team.id,
        type: 'flag',
        display: team.flag,
      });
      cards.push({
        id: `${team.id}-name`,
        pairId: team.id,
        type: 'name',
        display: team.name,
      });
    }
    return this.shuffle(cards);
  }

  private buildFlowDeck(pairs: CardMatchPair[], pairCount: number): MatchCard[] {
    const selectedPairs = this.shuffle([...pairs]).slice(0, pairCount);
    const cards: MatchCard[] = [];
    for (const pair of selectedPairs) {
      cards.push({
        id: `${pair.id}-clue`,
        pairId: pair.id,
        type: 'clue',
        display: pair.clue,
      });
      cards.push({
        id: `${pair.id}-answer`,
        pairId: pair.id,
        type: 'answer',
        display: pair.answer,
      });
    }
    return this.shuffle(cards);
  }

  private initStatuses(deck: MatchCard[]): Record<string, CardStatus> {
    const statuses: Record<string, CardStatus> = {};
    for (const card of deck) {
      statuses[card.id] = 'hidden';
    }
    return statuses;
  }

  private shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
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
