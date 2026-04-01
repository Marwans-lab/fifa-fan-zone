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

const LEGACY_PAIR_COUNT = 3;
const LEGACY_ROUND_TIME = 30;
const FLOW_PAIR_COUNT = 3;
const FLOW_ROUND_TIME = 45;
const MISMATCH_DELAY = 700;
const MATCH_DELAY = 420;

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <main
      data-page="card-match"
      style="
        min-height: 100dvh;
        background: var(--c-bg);
        color: var(--c-text-1);
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
          padding: var(--sp-4);
        "
      >
        <header style="display: flex; align-items: center; gap: var(--sp-3); margin-bottom: var(--sp-4)">
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
              background: var(--c-surface-raise);
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

        <h1
          style="
            margin: 0 0 var(--sp-2);
            text-align: center;
            font: var(--f-brand-type-title-4);
            color: var(--c-text-1);
          "
        >
          {{ pageTitle() }}
        </h1>
        @if (activeQuiz()) {
          <p
            style="
              margin: 0 0 var(--sp-4);
              text-align: center;
              font: var(--f-brand-type-caption);
              color: var(--c-text-2);
            "
          >
            Round {{ currentRound() + 1 }} of {{ totalRounds() }}
          </p>
        }

        <div
          style="
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: var(--sp-2);
            margin-bottom: var(--sp-4);
          "
        >
          @for (card of deck(); track card.id) {
            <button
              type="button"
              data-section="card-item"
              [disabled]="statuses()[card.id] !== 'hidden' || gameComplete() || lockInput()"
              (click)="flipCard(card.id)"
              [ngStyle]="cardOuterStyle(card.id)"
            >
              <div [ngStyle]="cardInnerStyle(card.id)">
                <div [ngStyle]="cardBackStyle()">?</div>
                <div [ngStyle]="cardFrontStyle(card.id)">
                  {{ card.display }}
                </div>
              </div>
            </button>
          }
        </div>

        <div
          style="
            display: flex;
            justify-content: center;
            align-items: center;
            gap: var(--sp-6);
            margin-bottom: var(--sp-4);
          "
        >
          <div style="text-align: center; min-width: var(--sp-12)">
            <p style="margin: 0; font: var(--f-brand-type-headline-medium); color: var(--c-correct)">
              {{ matchedPairs() }}/{{ pairCount() }}
            </p>
            <p style="margin: 0; font: var(--f-brand-type-caption); color: var(--c-text-2)">Matched</p>
          </div>
          <div style="text-align: center; min-width: var(--sp-12)">
            <p style="margin: 0; font: var(--f-brand-type-headline-medium)">{{ timeLeft() }}</p>
            <p style="margin: 0; font: var(--f-brand-type-caption); color: var(--c-text-2)">Time</p>
          </div>
          <div style="text-align: center; min-width: var(--sp-12)">
            <p style="margin: 0; font: var(--f-brand-type-headline-medium)">{{ moves() }}</p>
            <p style="margin: 0; font: var(--f-brand-type-caption); color: var(--c-text-2)">Moves</p>
          </div>
        </div>

        <button
          type="button"
          (click)="goToResults()"
          style="
            margin-top: auto;
            width: 100%;
            min-height: var(--sp-14);
            border: none;
            border-radius: var(--f-brand-radius-rounded);
            background: var(--f-brand-color-background-primary);
            color: var(--f-brand-color-text-light);
            font: var(--f-brand-type-body-medium);
            cursor: pointer;
          "
        >
          Next
        </button>
      </section>

      @if (showCompletion()) {
        <section
          style="
            position: fixed;
            inset: 0;
            background: var(--f-brand-color-background-dark-50a);
            backdrop-filter: blur(var(--f-brand-blur-medium));
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--sp-4);
            z-index: 10;
          "
        >
          <div
            style="
              width: 100%;
              max-width: 320px;
              border-radius: var(--f-brand-radius-outer);
              border: var(--f-brand-border-size-default) solid var(--c-border);
              background: var(--c-surface);
              padding: var(--sp-6) var(--sp-4);
              text-align: center;
            "
          >
            <h2 style="margin: 0 0 var(--sp-2); font: var(--f-brand-type-title-4)">Well done!</h2>
            <p style="margin: 0 0 var(--sp-4); font: var(--f-brand-type-caption); color: var(--c-text-2)">
              You matched all pairs.
            </p>
            <button
              type="button"
              (click)="goToResults()"
              style="
                width: 100%;
                min-height: var(--sp-12);
                border: none;
                border-radius: var(--f-brand-radius-rounded);
                background: var(--f-brand-color-background-primary);
                color: var(--f-brand-color-text-light);
                font: var(--f-brand-type-body-medium);
              "
            >
              View results
            </button>
          </div>
        </section>
      }
    </main>
  `,
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
  readonly moves = signal(0);
  readonly matchedPairs = signal(0);
  readonly timeLeft = signal(LEGACY_ROUND_TIME);
  readonly gameComplete = signal(false);
  readonly showCompletion = signal(false);
  readonly started = signal(false);
  readonly lockInput = signal(false);

  readonly pairCount = computed(() => (this.activeQuiz() ? FLOW_PAIR_COUNT : LEGACY_PAIR_COUNT));
  readonly roundTime = computed(() => (this.activeQuiz() ? FLOW_ROUND_TIME : LEGACY_ROUND_TIME));
  readonly totalRounds = computed(() => this.activeQuiz()?.rounds.length ?? 1);
  readonly pageTitle = computed(() => this.activeQuiz()?.title ?? 'Match the cards');
  readonly progressPercent = computed(() => {
    const current = this.currentRound();
    const rounds = this.totalRounds();
    const localProgress = this.matchedPairs() / this.pairCount();
    if (rounds <= 1) return localProgress * 100;
    return ((current + localProgress) / rounds) * 100;
  });

  private timerId: number | null = null;

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
      window.setTimeout(() => {
        this.statuses.update(prev => ({
          ...prev,
          [nextFlipped[0]]: 'matched',
          [nextFlipped[1]]: 'matched',
        }));
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

    window.setTimeout(() => {
      this.statuses.update(prev => ({
        ...prev,
        [nextFlipped[0]]: 'mismatched',
        [nextFlipped[1]]: 'mismatched',
      }));
      window.setTimeout(() => {
        this.statuses.update(prev => ({
          ...prev,
          [nextFlipped[0]]: 'hidden',
          [nextFlipped[1]]: 'hidden',
        }));
        this.flippedIds.set([]);
        this.lockInput.set(false);
      }, 380);
    }, MISMATCH_DELAY);
  }

  handleBack(): void {
    this.analytics.track('card_match_abandoned', {
      moves: this.moves(),
      timeLeft: this.timeLeft(),
      matchedPairs: this.matchedPairs(),
    });
    window.history.back();
  }

  cardOuterStyle(cardId: string): Record<string, string> {
    return {
      width: '100%',
      aspectRatio: '170 / 160',
      padding: '0',
      border: 'none',
      background: 'transparent',
      perspective: '600px',
      cursor: this.statuses()[cardId] === 'hidden' ? 'pointer' : 'default',
    };
  }

  cardInnerStyle(cardId: string): Record<string, string> {
    const status = this.statuses()[cardId] ?? 'hidden';
    const flipped = status !== 'hidden';
    return {
      position: 'relative',
      width: '100%',
      height: '100%',
      transformStyle: 'preserve-3d',
      transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      transition: 'transform var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default)',
    };
  }

  cardBackStyle(): Record<string, string> {
    return {
      position: 'absolute',
      inset: '0',
      borderRadius: 'var(--f-brand-radius-small)',
      border: `var(--f-brand-border-size-default) solid var(--c-border)`,
      background: 'var(--f-brand-color-background-primary)',
      color: 'var(--f-brand-color-text-light)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      font: 'var(--f-brand-type-title-3)',
      backfaceVisibility: 'hidden',
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
      border: `${mismatch ? 'var(--f-brand-border-size-focused)' : 'var(--f-brand-border-size-default)'} solid ${
        matched ? 'var(--c-correct-border)' : mismatch ? 'var(--c-error-border)' : 'var(--c-border)'
      }`,
      background: matched ? 'var(--c-correct-bg)' : mismatch ? 'var(--c-error-bg)' : 'var(--c-surface)',
      color: matched ? 'var(--c-correct)' : mismatch ? 'var(--c-error)' : 'var(--c-text-1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 'var(--sp-2)',
      font: 'var(--f-brand-type-caption-medium)',
      backfaceVisibility: 'hidden',
      transform: 'rotateY(180deg)',
      overflow: 'hidden',
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
    this.stopTimer();
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
      window.setTimeout(() => this.setupRound(this.currentRound() + 1), 700);
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

  private calculateScore(moves: number, matched: number, timeLeft: number, pairCount: number): number {
    if (matched === 0) return 0;
    const matchBonus = matched * 2;
    const moveScore = Math.max(0, pairCount - Math.max(0, moves - pairCount));
    const timeBonus = timeLeft >= 20 ? 2 : timeLeft >= 10 ? 1 : 0;
    return matchBonus + moveScore + timeBonus;
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
