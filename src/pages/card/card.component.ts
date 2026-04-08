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
  type: 'quiz' | 'swipe' | 'card_match' | 'ranking' | 'spin_wheel';
}

@Component({
  standalone: true,
  imports: [CommonModule, ScreenComponent, FanCardComponent],
  template: `
    <app-screen className="f-card-page">
      <main #contentEl class="f-card-page__content f-page-enter hide-scrollbar" data-page="card">
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
              <h2 class="f-card-page__journey-title">{{ journeyStatusTitle() }}</h2>
            </div>
            <span class="f-card-page__journey-pill">Step {{ currentStep() }}/4</span>
          </div>

          <div class="f-card-page__journey-track">
            @for (milestone of milestones(); track milestone.label; let idx = $index; let last = $last) {
              <div class="f-card-page__journey-item">
                <div
                  class="f-card-page__journey-node"
                  [class.f-card-page__journey-node--completed]="milestone.completed"
                  [class.f-card-page__journey-node--current]="idx === currentMilestoneIndex()"
                >
                  @if (idx === currentMilestoneIndex()) {
                    <div class="animate-ping-slow f-card-page__journey-ping"></div>
                  }
                  @if (milestone.completed) {
                    <span
                      class="f-card-page__journey-icon f-card-page__journey-icon--tick"
                      aria-hidden="true"
                    ></span>
                  } @else {
                    <span
                      class="f-card-page__journey-icon"
                      [ngStyle]="{
                        'mask-image': 'url(' + milestone.iconSrc + ')',
                        '-webkit-mask-image': 'url(' + milestone.iconSrc + ')'
                      }"
                      aria-hidden="true"
                    ></span>
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
                  [class.f-card-page__journey-line--completed]="isConnectorCompleted(idx)"
                  [class.f-card-page__journey-line--half]="isConnectorHalfCompleted(idx)"
                  [class.f-card-page__journey-line--inactive]="!isConnectorCompleted(idx) && !isConnectorHalfCompleted(idx)"
                ></div>
              }
            }
          </div>

          <button
            type="button"
            class="f-card-page__journey-cta"
            [class.f-card-page__journey-cta--all-complete]="allQuizzesCompleted()"
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
            Complete quizzes to get a chance to earn Avios rewards
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
                  <div class="f-card-page__quiz-ring-wrap">
                    <svg
                      class="f-card-page__quiz-ring"
                      [attr.width]="quizRingRadius * 2"
                      [attr.height]="quizRingRadius * 2"
                      aria-hidden="true"
                    >
                      <circle
                        class="f-card-page__quiz-ring-track"
                        [attr.cx]="quizRingRadius"
                        [attr.cy]="quizRingRadius"
                        [attr.r]="quizRingNormRadius"
                        [attr.stroke-width]="quizRingStroke"
                      />
                      @if (isFlowCompleted(flow.id)) {
                        <circle
                          class="f-card-page__quiz-ring-arc"
                          [attr.cx]="quizRingRadius"
                          [attr.cy]="quizRingRadius"
                          [attr.r]="quizRingNormRadius"
                          [attr.stroke-width]="quizRingStroke"
                          [attr.stroke-dasharray]="quizRingCircumference"
                          [attr.stroke-dashoffset]="0"
                        />
                      }
                    </svg>
                    <div class="f-card-page__quiz-icon-wrap">
                      @if (isFlowLocked(flow)) {
                        <img class="f-card-page__quiz-icon f-card-page__quiz-icon--locked" src="assets/icons/Lock-white.svg" alt="" />
                      } @else if (isFlowCompleted(flow.id)) {
                        <img class="f-card-page__quiz-icon" src="assets/icons/Tick-black.svg" alt="" />
                      } @else {
                        <img class="f-card-page__quiz-icon f-card-page__quiz-icon--quiz" [src]="flow.iconSrc" alt="" />
                      }
                    </div>
                  </div>

                  <div class="f-card-page__quiz-copy">
                    <h3 class="f-card-page__quiz-title">{{ flow.title }}</h3>
                    <p
                      class="f-card-page__quiz-subtitle"
                      [class.f-card-page__quiz-subtitle--default]="!isFlowLocked(flow)"
                    >
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
        padding: var(--sp-4) var(--f-brand-space-md);
        gap: var(--f-base-space-6);
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
        gap: var(--sp-6);
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
        letter-spacing: var(--tracking-wide);
        color: var(--f-brand-color-text-muted);
      }

      .f-card-page__journey-title {
        margin: 0;
        font: var(--f-brand-type-headline-medium);
        letter-spacing: var(--tracking-semi);
        color: var(--f-brand-color-text-default);
      }

      .f-card-page__journey-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--f-brand-radius-rounded);
        padding: 10px var(--f-brand-space-md);
        font: var(--f-brand-type-caption);
        color: var(--f-brand-color-text-subtle);
        background: var(--f-brand-color-background-default);
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
        position: relative;
        backdrop-filter: blur(var(--f-brand-blur-subtle));
        -webkit-backdrop-filter: blur(var(--f-brand-blur-subtle));
        background: var(--f-brand-color-background-default);
        border: var(--f-brand-border-size-default) solid var(--f-brand-color-border-default);
        transition: all var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default);
      }

      .f-card-page__journey-node--completed {
        background: var(--f-brand-color-background-success);
        border-color: var(--f-brand-color-background-success);
        box-shadow: var(--c-lt-shadow-glow);
        transform: scale(1.1);
        z-index: 20;
      }

      .f-card-page__journey-node--current {
        transform: scale(1.05);
        z-index: 20;
        background: var(--f-brand-color-background-default);
        border-color: var(--f-brand-color-border-default);
      }

      .f-card-page__journey-ping {
        position: absolute;
        inset: 0;
        border-radius: var(--r-full);
        background: var(--f-brand-color-background-success);
        pointer-events: none;
      }

      .f-card-page__journey-icon {
        width: var(--sp-6);
        height: var(--sp-6);
        display: block;
        background-color: var(--f-brand-color-icon-muted);
        mask-size: contain;
        mask-repeat: no-repeat;
        mask-position: center;
        -webkit-mask-size: contain;
        -webkit-mask-repeat: no-repeat;
        -webkit-mask-position: center;
        position: relative;
        z-index: 1;
      }

      .f-card-page__journey-icon--tick {
        mask-image: url(/assets/icons/Tick-black.svg);
        -webkit-mask-image: url(/assets/icons/Tick-black.svg);
        background-color: var(--f-brand-color-icon-light);
      }

      .f-card-page__journey-step-label {
        margin: 0;
        text-align: center;
        font: var(--f-brand-type-caption);
        letter-spacing: var(--tracking-semi);
        color: var(--f-brand-color-text-default);
      }

      .f-card-page__journey-step-label--inactive {
        color: var(--f-brand-color-text-subtle);
      }

      .f-card-page__journey-line {
        flex: 1;
        height: 2px;
        margin-top: calc(var(--sp-14) / 2 - 1px);
        background: var(--f-brand-color-border-default);
        transition: all var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default);
      }

      .f-card-page__journey-line--completed {
        background: var(--f-brand-color-background-success);
      }

      .f-card-page__journey-line--half {
        background: linear-gradient(
          90deg,
          var(--f-brand-color-background-success),
          var(--f-brand-color-border-default)
        );
      }

      .f-card-page__journey-line--inactive {
        opacity: 0.4;
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

      .f-card-page__journey-cta--all-complete {
        background: var(--c-accent-soft);
        color: var(--c-accent);
        border: var(--f-brand-border-size-default) solid var(--c-accent-border);
      }

      .f-card-page__journey-cta:hover {
        background: var(--f-brand-color-background-primary-hover);
      }

      .f-card-page__journey-cta--all-complete:hover {
        background: var(--c-accent-soft);
      }

      .f-card-page__journey-cta:disabled {
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
        letter-spacing: var(--tracking-tighter);
        color: var(--f-brand-color-text-default);
      }

      .f-card-page__quiz-description {
        margin: var(--sp-1) 0 0;
        font: var(--f-brand-type-subheading);
        color: var(--f-brand-color-text-default);
      }

      .f-card-page__quiz-grid {
        margin-top: var(--sp-4);
        display: grid;
        gap: var(--f-brand-space-md);
      }

      .f-card-page__quiz-card {
        width: 100%;
        min-height: 120px;
        border: none;
        border-radius: var(--f-brand-radius-outer);
        background: var(--f-brand-color-background-light);
        box-shadow: var(--f-brand-shadow-medium);
        padding: var(--sp-5) var(--sp-4);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--f-brand-space-md);
        text-align: left;
        cursor: pointer;
        transition: all var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default);
      }

      .f-card-page__quiz-card:focus-visible {
        outline: var(--f-brand-border-size-focused) solid var(--f-brand-color-border-primary);
        outline-offset: var(--sp-1);
      }

      .f-card-page__quiz-card--completed {
        background: var(--f-brand-color-background-light);
      }

      .f-card-page__quiz-card--locked {
        background: var(--f-brand-color-background-light);
        opacity: 0.55;
        cursor: not-allowed;
      }

      .f-card-page__quiz-card-content {
        display: flex;
        align-items: center;
        gap: var(--f-brand-space-md);
        min-width: 0;
      }

      .f-card-page__quiz-ring-wrap {
        width: 64px;
        height: 64px;
        position: relative;
        flex-shrink: 0;
      }

      .f-card-page__quiz-ring {
        position: absolute;
        top: 0;
        left: 0;
        transform: rotate(-90deg);
      }

      .f-card-page__quiz-ring-track {
        fill: none;
        stroke: var(--f-brand-color-border-default);
      }

      .f-card-page__quiz-ring-arc {
        fill: none;
        stroke: var(--f-brand-color-flight-status-confirmed);
        stroke-linecap: round;
        transition: stroke-dashoffset var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default);
      }

      .f-card-page__quiz-icon-wrap {
        position: absolute;
        inset: 0;
        margin: auto;
        width: calc(var(--sp-12) + var(--sp-1));
        height: calc(var(--sp-12) + var(--sp-1));
        border-radius: var(--r-full);
        background: linear-gradient(135deg, var(--c-lt-tint-subtle), var(--c-lt-tint-faint));
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: var(--c-lt-shadow-sm);
      }

      .f-card-page__quiz-card--completed .f-card-page__quiz-icon-wrap {
        background: linear-gradient(135deg, var(--c-accent-soft), var(--c-accent-faint));
      }

      .f-card-page__quiz-card--locked .f-card-page__quiz-icon-wrap {
        background: var(--c-lt-tint-subtle);
        box-shadow: none;
      }

      .f-card-page__quiz-icon {
        width: var(--sp-6);
        height: var(--sp-6);
      }

      .f-card-page__quiz-icon--quiz,
      .f-card-page__quiz-icon--locked {
        filter: invert(1);
      }

      .f-card-page__quiz-icon--locked {
        opacity: 0.4;
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

      .f-card-page__quiz-subtitle--default {
        color: var(--f-brand-color-text-default);
      }

      .f-card-page__quiz-card--locked .f-card-page__quiz-subtitle {
        color: var(--f-brand-color-text-subtle);
      }

      .f-card-page__quiz-action {
        width: var(--sp-9);
        min-height: var(--sp-9);
        border-radius: var(--r-full);
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--c-lt-tint);
        flex-shrink: 0;
      }

      .f-card-page__quiz-action img {
        width: var(--sp-6);
        height: var(--sp-6);
        filter: invert(1);
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

  @ViewChild('contentEl') private readonly contentEl?: ElementRef<HTMLElement>;
  @ViewChild('fanCardSection') private readonly fanCardSection?: ElementRef<HTMLElement>;
  @ViewChild('quizSection') private readonly quizSection?: ElementRef<HTMLElement>;
  @ViewChild(FanCardComponent) private readonly fanCardComponent?: FanCardComponent;

  readonly state = this.store.state;
  readonly quizRingRadius = 32;
  readonly quizRingStroke = 4;
  readonly quizRingNormRadius = this.quizRingRadius - this.quizRingStroke / 2;
  readonly quizRingCircumference = 2 * Math.PI * this.quizRingNormRadius;

  readonly flowCards: ReadonlyArray<QuizFlowCard> = [
    {
      id: 'the-connector',
      title: 'The Connector',
      subtitle: '5 questions · Quiz',
      iconSrc: 'assets/icons/globe-white.svg',
      route: '/quiz',
      routeState: { quizId: 'the-connector' },
      type: 'quiz',
    },
    {
      id: 'the-architect',
      title: 'The Architect',
      subtitle: '5 rounds · Card Match',
      iconSrc: 'assets/icons/stadium-white.svg',
      route: '/card-match',
      routeState: { flowId: 'the-architect' },
      type: 'card_match',
    },
    {
      id: 'the-historian',
      title: 'The Historian',
      subtitle: '5 questions · Ranking',
      iconSrc: 'assets/icons/history-white.svg',
      route: '/ranking-quiz',
      routeState: { quizId: 'the-historian' },
      type: 'ranking',
    },
    {
      id: 'the-referee',
      title: 'The Referee',
      subtitle: '10 statements · Swipe',
      iconSrc: 'assets/icons/referee-white.svg',
      route: '/swipe-quiz',
      routeState: { quizId: 'the-referee' },
      type: 'swipe',
    },
    {
      id: 'the-retrospective',
      title: 'The Retrospective',
      subtitle: '5 questions · Spin Wheel',
      iconSrc: 'assets/icons/ranking-white.svg',
      route: '/spin-wheel-quiz',
      routeState: { quizId: 'the-retrospective' },
      type: 'spin_wheel',
    },
  ];

  readonly milestones = computed<JourneyMilestone[]>(() => {
    const completedCount = this.state().completedFlows.length;
    return [
      {
        iconSrc: 'assets/icons/qr-logo.svg',
        label: 'Fan card',
        completed: this.isCardComplete(),
      },
      {
        iconSrc: 'assets/icons/globe-dark.svg',
        label: '1st quiz',
        completed: completedCount >= 1,
      },
      {
        iconSrc: 'assets/icons/stadium-dark.svg',
        label: '3 quizzes',
        completed: completedCount >= 3,
      },
      {
        iconSrc: 'assets/icons/Trophy-dark.svg',
        label: 'Reward',
        completed: this.allQuizzesCompleted(),
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
    return this.milestones().findIndex(milestone => !milestone.completed);
  });

  readonly journeyCtaLabel = computed(() => {
    if (this.allQuizzesCompleted()) {
      return 'All quizzes completed!';
    }
    if (!this.isCardComplete()) {
      return 'Complete fan card';
    }
    return 'Start quiz';
  });

  readonly journeyStatusTitle = computed(() => {
    const done = this.completedMilestones();
    if (done === 0) {
      return 'New arrival';
    }
    if (done === 1) {
      return 'Rising fan';
    }
    if (done === 2) {
      return 'Quiz taker';
    }
    if (done === 3) {
      return 'Top fan';
    }
    return 'Reward unlocked';
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
      this.fanCardSection?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.scrollToTop();
      window.setTimeout(() => this.fanCardComponent?.flipToBack(), 500);
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

  allQuizzesCompleted(): boolean {
    return this.state().completedFlows.length >= this.flowCards.length;
  }

  isJourneyCtaDisabled(): boolean {
    return this.allQuizzesCompleted();
  }

  isConnectorCompleted(index: number): boolean {
    const current = this.milestones()[index]?.completed ?? false;
    const next = this.milestones()[index + 1]?.completed ?? false;
    return current && next;
  }

  isConnectorHalfCompleted(index: number): boolean {
    const current = this.milestones()[index]?.completed ?? false;
    const next = this.milestones()[index + 1]?.completed ?? false;
    return current && !next;
  }

  private scrollToTop(): void {
    const el = this.contentEl?.nativeElement;
    const scrollContainer = el?.closest<HTMLElement>('.f-screen');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
