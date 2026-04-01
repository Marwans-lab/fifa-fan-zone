import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { FanCardComponent } from '../../components/fan-card/fan-card.component';
import { ScreenComponent } from '../../components/screen/screen.component';
import { FlowId } from '../../models/flow-id.model';
import { AnalyticsService } from '../../services/analytics.service';
import { CardExportService } from '../../services/card-export.service';
import { QAAppService } from '../../services/qaapp.service';
import { StoreService } from '../../services/store.service';

interface JourneyMilestone {
  iconSrc: string;
  label: string;
  completed: boolean;
}

interface QuizFlowCard {
  id: FlowId;
  title: string;
  subtitle: string;
  iconSrc: string;
  route: string;
  routeState: Record<string, string>;
  type: 'quiz' | 'swipe' | 'card_match' | 'ranking';
}

@Component({
  standalone: true,
  imports: [CommonModule, ScreenComponent, FanCardComponent],
  template: `
    <app-screen className="f-card-page">
      <main class="f-card-page__content f-page-enter hide-scrollbar" data-page="card">
        <section #fanCardSection class="f-card-page__fan-card" aria-label="Your fan card">
          <app-fan-card
            [fanCard]="state().fanCard"
            (onSave)="handleFanCardSave($event)"
            (share)="handleShare()"
            (saveToDevice)="handleSaveToDevice()"
          />
        </section>

        <section class="f-card-page__journey" data-section="journey-tracker" aria-label="Your journey">
          <div class="f-card-page__journey-header">
            <div>
              <p class="f-card-page__journey-label">Your journey</p>
              <h2 class="f-card-page__journey-title">Step {{ currentStep() }}/4</h2>
            </div>
            <span class="f-card-page__journey-pill">{{ completedMilestones() }} completed</span>
          </div>

          <div class="f-card-page__journey-track">
            @for (milestone of milestones(); track milestone.label; let idx = $index; let last = $last) {
              <div class="f-card-page__journey-item">
                <div
                  class="f-card-page__journey-node"
                  [class.f-card-page__journey-node--completed]="milestone.completed"
                  [class.f-card-page__journey-node--current]="idx === currentMilestoneIndex()"
                >
                  @if (milestone.completed) {
                    <img
                      class="f-card-page__journey-icon f-card-page__journey-icon--tick"
                      src="assets/icons/Tick-black.svg"
                      alt=""
                    />
                  } @else {
                    <img
                      class="f-card-page__journey-icon"
                      [src]="milestone.iconSrc"
                      alt=""
                    />
                  }
                </div>
                <p
                  class="f-card-page__journey-step-label"
                  [class.f-card-page__journey-step-label--inactive]="!milestone.completed && idx !== currentMilestoneIndex()"
                >
                  {{ milestone.label }}
                </p>
              </div>
              @if (!last) {
                <div
                  class="f-card-page__journey-line"
                  [class.f-card-page__journey-line--completed]="milestone.completed"
                ></div>
              }
            }
          </div>

          <button
            type="button"
            class="f-card-page__journey-cta"
            data-ui="journey-cta"
            [disabled]="isJourneyCtaDisabled()"
            (click)="handleJourneyCta()"
          >
            {{ journeyCtaLabel() }}
          </button>
        </section>

        <section
          #quizSection
          class="f-card-page__quiz-section"
          data-section="quiz-hub"
          aria-label="Quiz hub"
        >
          <h2 class="f-card-page__quiz-heading">Earn Avios</h2>
          <p class="f-card-page__quiz-description">
            Complete quizzes to get a chance to earn Avios rewards.
          </p>

          <div class="f-card-page__quiz-grid f-stagger">
            @for (flow of flowCards; track flow.id) {
              <button
                type="button"
                class="f-card-page__quiz-card"
                [class.f-card-page__quiz-card--locked]="isFlowLocked(flow)"
                [class.f-card-page__quiz-card--completed]="isFlowCompleted(flow.id)"
                [disabled]="isFlowLocked(flow)"
                (click)="handleStartFlow(flow)"
              >
                <div class="f-card-page__quiz-card-content">
                  <div class="f-card-page__quiz-icon-wrap">
                    @if (isFlowLocked(flow)) {
                      <img class="f-card-page__quiz-icon" src="assets/icons/Lock-white.svg" alt="" />
                    } @else if (isFlowCompleted(flow.id)) {
                      <img class="f-card-page__quiz-icon" src="assets/icons/Tick-black.svg" alt="" />
                    } @else {
                      <img class="f-card-page__quiz-icon" [src]="flow.iconSrc" alt="" />
                    }
                  </div>

                  <div class="f-card-page__quiz-copy">
                    <h3 class="f-card-page__quiz-title">{{ flow.title }}</h3>
                    <p class="f-card-page__quiz-subtitle">
                      {{ getFlowStatusLabel(flow) }}
                    </p>
                  </div>
                </div>

                @if (!isFlowLocked(flow) && !isFlowCompleted(flow.id)) {
                  <span class="f-card-page__quiz-action">
                    <img src="assets/icons/Chevron-right-white.svg" alt="" />
                  </span>
                }
              </button>
            }
          </div>
        </section>
      </main>
    </app-screen>
  `,
  styles: [
    `
      .f-card-page {
        background: var(--c-lt-bg);
      }

      .f-card-page__content {
        display: flex;
        flex-direction: column;
        min-height: 100%;
        padding: var(--sp-4);
        gap: var(--sp-4);
      }

      .f-card-page__fan-card {
        width: 100%;
      }

      .f-card-page__journey {
        background: var(--f-brand-color-background-light);
        border-radius: var(--f-brand-radius-outer);
        box-shadow: var(--f-brand-shadow-medium);
        padding: var(--sp-4);
        display: flex;
        flex-direction: column;
        gap: var(--sp-4);
      }

      .f-card-page__journey-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--sp-3);
      }

      .f-card-page__journey-label {
        margin: 0;
        font: var(--f-brand-type-caption);
        color: var(--f-brand-color-text-subtle);
      }

      .f-card-page__journey-title {
        margin: 0;
        font: var(--f-brand-type-headline-medium);
        color: var(--f-brand-color-text-default);
      }

      .f-card-page__journey-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: var(--sp-11);
        border-radius: var(--f-brand-radius-rounded);
        padding: 0 var(--sp-3);
        font: var(--f-brand-type-caption);
        color: var(--f-brand-color-text-subtle);
        background: var(--f-brand-color-background-default);
        border: var(--f-brand-border-size-default) solid var(--f-brand-color-border-default);
      }

      .f-card-page__journey-track {
        display: flex;
        align-items: flex-start;
        width: 100%;
      }

      .f-card-page__journey-item {
        width: var(--sp-14);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--sp-2);
        flex-shrink: 0;
      }

      .f-card-page__journey-node {
        width: var(--sp-14);
        min-height: var(--sp-14);
        border-radius: var(--r-full);
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--f-brand-color-background-default);
        border: var(--f-brand-border-size-default) solid var(--f-brand-color-border-default);
        transition: transform var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default);
      }

      .f-card-page__journey-node--completed {
        background: var(--f-brand-color-background-success);
        border-color: var(--f-brand-color-background-success);
      }

      .f-card-page__journey-node--current {
        transform: scale(1.05);
        border-color: var(--f-brand-color-border-primary);
      }

      .f-card-page__journey-icon {
        width: var(--sp-6);
        height: var(--sp-6);
      }

      .f-card-page__journey-icon--tick {
        filter: invert(1);
      }

      .f-card-page__journey-step-label {
        margin: 0;
        text-align: center;
        font: var(--f-brand-type-caption);
        color: var(--f-brand-color-text-default);
      }

      .f-card-page__journey-step-label--inactive {
        color: var(--f-brand-color-text-subtle);
      }

      .f-card-page__journey-line {
        flex: 1;
        height: var(--f-brand-border-size-focused);
        margin-top: calc(var(--sp-14) / 2 - var(--f-brand-border-size-default));
        background: var(--f-brand-color-border-default);
      }

      .f-card-page__journey-line--completed {
        background: var(--f-brand-color-background-success);
      }

      .f-card-page__journey-cta {
        width: 100%;
        min-height: var(--sp-12);
        border: none;
        border-radius: var(--f-brand-radius-rounded);
        background: var(--f-brand-color-background-primary);
        color: var(--f-brand-color-text-light);
        font: var(--f-brand-type-body-medium);
        cursor: pointer;
        transition: background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
      }

      .f-card-page__journey-cta:hover {
        background: var(--f-brand-color-background-primary-hover);
      }

      .f-card-page__journey-cta:disabled {
        background: var(--f-brand-color-background-disabled);
        color: var(--f-brand-color-text-disabled);
        cursor: default;
      }

      .f-card-page__journey-cta:focus-visible {
        outline: var(--f-brand-border-size-focused) solid var(--f-brand-color-border-primary);
        outline-offset: var(--sp-1);
      }

      .f-card-page__quiz-section {
        padding-bottom: var(--sp-10);
      }

      .f-card-page__quiz-heading {
        margin: 0;
        font: var(--f-brand-type-title-2);
        color: var(--f-brand-color-text-default);
      }

      .f-card-page__quiz-description {
        margin: var(--sp-1) 0 0;
        font: var(--f-brand-type-subheading);
        color: var(--f-brand-color-text-subtle);
      }

      .f-card-page__quiz-grid {
        margin-top: var(--sp-4);
        display: grid;
        gap: var(--sp-3);
      }

      .f-card-page__quiz-card {
        width: 100%;
        min-height: calc(var(--sp-20) + var(--sp-10));
        border: var(--f-brand-border-size-default) solid transparent;
        border-radius: var(--f-brand-radius-inner);
        background: var(--f-brand-color-background-light);
        box-shadow: var(--f-brand-shadow-medium);
        padding: var(--sp-4);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--sp-3);
        text-align: left;
        cursor: pointer;
      }

      .f-card-page__quiz-card:focus-visible {
        outline: var(--f-brand-border-size-focused) solid var(--f-brand-color-border-primary);
        outline-offset: var(--sp-1);
      }

      .f-card-page__quiz-card--completed {
        border-color: var(--f-brand-color-background-success);
        background: var(--f-brand-color-background-success-accent);
      }

      .f-card-page__quiz-card--locked {
        background: var(--f-brand-color-background-default);
        border-color: var(--f-brand-color-border-default);
        cursor: not-allowed;
      }

      .f-card-page__quiz-card-content {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        min-width: 0;
      }

      .f-card-page__quiz-icon-wrap {
        width: var(--sp-16);
        min-height: var(--sp-16);
        border-radius: var(--r-full);
        background: var(--f-brand-color-background-default);
        border: var(--f-brand-border-size-default) solid var(--f-brand-color-border-default);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .f-card-page__quiz-card--completed .f-card-page__quiz-icon-wrap {
        border-color: var(--f-brand-color-background-success);
      }

      .f-card-page__quiz-card--locked .f-card-page__quiz-icon-wrap {
        background: var(--f-brand-color-background-disabled);
        border-color: var(--f-brand-color-border-disabled);
      }

      .f-card-page__quiz-icon {
        width: var(--sp-6);
        height: var(--sp-6);
      }

      .f-card-page__quiz-copy {
        min-width: 0;
      }

      .f-card-page__quiz-title {
        margin: 0;
        font: var(--f-brand-type-headline-medium);
        color: var(--f-brand-color-text-default);
      }

      .f-card-page__quiz-card--locked .f-card-page__quiz-title {
        color: var(--f-brand-color-text-disabled);
      }

      .f-card-page__quiz-subtitle {
        margin: var(--sp-1) 0 0;
        font: var(--f-brand-type-caption);
        color: var(--f-brand-color-text-subtle);
      }

      .f-card-page__quiz-card--completed .f-card-page__quiz-subtitle {
        color: var(--f-brand-color-text-success);
      }

      .f-card-page__quiz-card--locked .f-card-page__quiz-subtitle {
        color: var(--f-brand-color-text-disabled);
      }

      .f-card-page__quiz-action {
        width: var(--sp-9);
        min-height: var(--sp-9);
        border-radius: var(--r-full);
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--f-brand-color-background-default);
        flex-shrink: 0;
      }

      .f-card-page__quiz-action img {
        width: var(--sp-6);
        height: var(--sp-6);
      }

      @media (prefers-reduced-motion: reduce) {
        .f-card-page__journey-node,
        .f-card-page__journey-cta {
          transition: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  private readonly router = inject(Router);
  private readonly store = inject(StoreService);
  private readonly analytics = inject(AnalyticsService);
  private readonly cardExportService = inject(CardExportService);
  private readonly qaappService = inject(QAAppService);

  @ViewChild('fanCardSection') private readonly fanCardSection?: ElementRef<HTMLElement>;
  @ViewChild('quizSection') private readonly quizSection?: ElementRef<HTMLElement>;
  @ViewChild(FanCardComponent) private readonly fanCardComponent?: FanCardComponent;

  readonly state = this.store.state;

  readonly flowCards: ReadonlyArray<QuizFlowCard> = [
    {
      id: 'the-connector',
      title: 'The connector',
      subtitle: '5 questions · Quiz',
      iconSrc: 'assets/icons/globe-white.svg',
      route: '/quiz',
      routeState: { quizId: 'the-connector' },
      type: 'quiz',
    },
    {
      id: 'the-architect',
      title: 'The architect',
      subtitle: '5 rounds · Card match',
      iconSrc: 'assets/icons/stadium-white.svg',
      route: '/card-match',
      routeState: { flowId: 'the-architect' },
      type: 'card_match',
    },
    {
      id: 'the-historian',
      title: 'The historian',
      subtitle: '10 statements · Swipe',
      iconSrc: 'assets/icons/history-white.svg',
      route: '/swipe-quiz',
      routeState: { quizId: 'the-historian' },
      type: 'swipe',
    },
    {
      id: 'the-referee',
      title: 'The referee',
      subtitle: '5 questions · Quiz',
      iconSrc: 'assets/icons/referee-white.svg',
      route: '/quiz',
      routeState: { quizId: 'the-referee' },
      type: 'quiz',
    },
    {
      id: 'the-retrospective',
      title: 'The retrospective',
      subtitle: '5 questions · Ranking',
      iconSrc: 'assets/icons/ranking-white.svg',
      route: '/ranking-quiz',
      routeState: { quizId: 'the-retrospective' },
      type: 'ranking',
    },
  ];

  readonly milestones = computed<JourneyMilestone[]>(() => {
    const completedFlows = this.state().completedFlows;
    return [
      {
        iconSrc: 'assets/icons/qr-logo.svg',
        label: 'Fan card',
        completed: this.isCardComplete(),
      },
      {
        iconSrc: 'assets/icons/globe-dark.svg',
        label: '1st quiz',
        completed: completedFlows.length > 0,
      },
      {
        iconSrc: 'assets/icons/ranking-dark.svg',
        label: 'All quizzes',
        completed: completedFlows.length >= this.flowCards.length,
      },
      {
        iconSrc: 'assets/icons/Trophy-dark.svg',
        label: 'Leaderboard',
        completed: this.state().hasVisitedLeaderboard,
      },
    ];
  });

  readonly completedMilestones = computed(() =>
    this.milestones().filter(milestone => milestone.completed).length
  );

  readonly currentStep = computed(() =>
    Math.min(this.completedMilestones() + 1, this.milestones().length)
  );

  readonly currentMilestoneIndex = computed(() => {
    const firstIncomplete = this.milestones().findIndex(milestone => !milestone.completed);
    return firstIncomplete === -1 ? this.milestones().length - 1 : firstIncomplete;
  });

  readonly journeyCtaLabel = computed(() => {
    if (!this.isCardComplete()) {
      return 'Complete fan card';
    }
    if (this.state().hasVisitedLeaderboard) {
      return 'Journey complete';
    }
    if (this.allQuizzesCompleted()) {
      return 'View leaderboard';
    }
    return 'Start quiz';
  });

  handleFanCardSave(answers: Record<string, string>): void {
    this.store.updateFanCard({
      answers,
      completedAt: new Date().toISOString(),
    });
  }

  async handleShare(): Promise<void> {
    try {
      const blob = await this.cardExportService.renderCardToBlob(this.state().fanCard);
      const file = new File([blob], 'fifa-fan-card.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My FIFA fan card',
          text: this.buildShareText(),
        });
      } else {
        await this.qaappService.openNativeShare({
          title: 'My FIFA fan card',
          text: this.buildShareText(),
        });
      }
      this.analytics.track('card_shared');
    } catch {
      // User cancelled or share target is unavailable.
    }
  }

  async handleSaveToDevice(): Promise<void> {
    try {
      const blob = await this.cardExportService.renderCardToBlob(this.state().fanCard);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'my-fan-card.png';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      this.analytics.track('card_saved_to_device');
    } catch {
      // Save fallback intentionally fails silently.
    }
  }

  handleJourneyCta(): void {
    if (this.isJourneyCtaDisabled()) {
      return;
    }

    if (!this.isCardComplete()) {
      this.analytics.track('complete_fan_card_journey_tapped');
      this.scrollToElement(this.fanCardSection);
      window.setTimeout(() => this.fanCardComponent?.startEditing(), 400);
      return;
    }

    if (this.allQuizzesCompleted()) {
      this.analytics.track('card_view_leaderboard_tapped');
      void this.router.navigateByUrl('/leaderboard');
      return;
    }

    this.analytics.track('card_start_quiz_tapped');
    const nextFlow = this.flowCards.find(flow => !this.isFlowCompleted(flow.id) && !this.isFlowLocked(flow));
    if (nextFlow) {
      this.handleStartFlow(nextFlow);
      return;
    }

    this.scrollToElement(this.quizSection);
  }

  handleStartFlow(flow: QuizFlowCard): void {
    if (this.isFlowLocked(flow)) {
      return;
    }
    this.analytics.track('quiz_card_tapped', { quizId: flow.id, type: flow.type });
    void this.router.navigateByUrl(flow.route, { state: flow.routeState });
  }

  isFlowLocked(flow: QuizFlowCard): boolean {
    return !this.isCardComplete() || !this.store.isFlowUnlocked(flow.id);
  }

  isFlowCompleted(flowId: FlowId): boolean {
    return this.state().completedFlows.includes(flowId);
  }

  getFlowStatusLabel(flow: QuizFlowCard): string {
    if (this.isFlowCompleted(flow.id)) {
      const result = this.state().quizResults[flow.id];
      if (result) {
        return `Completed · ${result.score}/${result.total} correct`;
      }
      return 'Completed';
    }
    if (this.isFlowLocked(flow)) {
      return this.isCardComplete()
        ? 'Complete the previous quiz to unlock'
        : 'Complete your fan card to unlock';
    }
    return flow.subtitle;
  }

  private isCardComplete(): boolean {
    return this.state().fanCard.completedAt !== null;
  }

  private allQuizzesCompleted(): boolean {
    return this.state().completedFlows.length >= this.flowCards.length;
  }

  isJourneyCtaDisabled(): boolean {
    return this.state().hasVisitedLeaderboard;
  }

  private scrollToElement(target?: ElementRef<HTMLElement>): void {
    target?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private buildShareText(): string {
    const fanCard = this.state().fanCard;
    const lines: string[] = ['My FIFA fan card'];
    if (fanCard.teamId) {
      lines.push(`Team: ${fanCard.teamId.toUpperCase()}`);
    }
    for (const [key, value] of Object.entries(fanCard.answers)) {
      if (value) {
        lines.push(`${key}: ${value}`);
      }
    }
    return lines.join('\n');
  }
}
