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
  iconClass: 'profile' | 'language' | 'stadium' | 'star';
  label: string;
  completed: boolean;
}

interface QuizFlowCard {
  id: FlowId;
  title: string;
  subtitle: string;
  iconClass: string;
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
                      [ngStyle]="fdsIconStyle('tick')"
                      aria-hidden="true"
                    ></span>
                  } @else {
                    <span
                      class="f-card-page__journey-icon"
                      [ngStyle]="fdsIconStyle(milestone.iconClass)"
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
                        <span class="f-card-page__quiz-icon f-card-page__quiz-icon--lock" [ngStyle]="fdsIconStyle('lock')" aria-hidden="true"></span>
                      } @else if (isFlowCompleted(flow.id)) {
                        <span class="f-card-page__quiz-icon f-card-page__quiz-icon--tick" [ngStyle]="fdsIconStyle('tick')" aria-hidden="true"></span>
                      } @else {
                        <span class="f-card-page__quiz-icon" [ngStyle]="fdsIconStyle(flow.iconClass)" aria-hidden="true"></span>
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
        display: block;
        mask-size: contain;
        mask-repeat: no-repeat;
        mask-position: center;
        -webkit-mask-size: contain;
        -webkit-mask-repeat: no-repeat;
        -webkit-mask-position: center;
        background-color: var(--f-brand-color-icon-default);
      }

      .f-card-page__quiz-icon--tick {
        background-color: var(--f-brand-color-icon-success);
      }

      .f-card-page__quiz-icon--lock {
        background-color: var(--f-brand-color-icon-muted);
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

  /* Real project SVG icons — mask-image data URIs (fills set to #1F212B) */
  private readonly fdsIcons: Record<string, string> = {
    profile: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' fill='%231F212B'/%3E%3C/svg%3E",
    star: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none'%3E%3Cpath d='M12 2l2.94 6.56L22 9.27l-5 4.54L18.18 21 12 17.27 5.82 21 7 13.81 2 9.27l7.06-.71L12 2Z' fill='%231F212B'/%3E%3C/svg%3E",
    language: "data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM4 12C4 11.39 4.08 10.79 4.21 10.22L8 14V15C8 16.1 8.9 17 10 17V19.93C6.61 19.44 4 16.48 4 12ZM17.9 17.39C17.64 16.58 16.9 16 16 16H15V13C15 12.45 14.55 12 14 12H8V10H10C10.55 10 11 9.55 11 9V7H13C14.1 7 15 6.1 15 5V4.59C17.93 5.78 20 8.65 20 12C20 14.08 19.2 15.97 17.9 17.39Z' fill='%231F212B'/%3E%3C/svg%3E",
    stadium: "data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20.4202 3.25H3.58023C2.82734 3.25106 2.10559 3.55061 1.57322 4.08299C1.04085 4.61536 0.741293 5.33711 0.740234 6.09V17.84C0.741293 18.5929 1.04085 19.3146 1.57322 19.847C2.10559 20.3794 2.82734 20.6789 3.58023 20.68H4.51023C4.57294 20.7085 4.64138 20.7222 4.71023 20.72C4.7786 20.7173 4.8461 20.7038 4.91023 20.68H20.4302C21.1831 20.6789 21.9049 20.3794 22.4372 19.847C22.9696 19.3146 23.2692 18.5929 23.2702 17.84V6.1C23.2692 5.34711 22.9696 4.62536 22.4372 4.09299C21.9049 3.56061 21.1831 3.26106 20.4302 3.26L20.4202 3.25ZM22.2602 6.74C21.6428 6.63394 21.0749 6.33478 20.6383 5.88555C20.2016 5.43633 19.9187 4.86019 19.8302 4.24H20.4202C20.9081 4.24053 21.3758 4.43456 21.7207 4.77951C22.0657 5.12446 22.2597 5.59216 22.2602 6.08V6.74ZM4.16023 4.25C4.05785 4.8573 3.76883 5.41762 3.33335 5.85311C2.89786 6.2886 2.33753 6.57761 1.73023 6.68V6.09C1.73076 5.60216 1.92479 5.13446 2.26974 4.78951C2.61469 4.44456 3.0824 4.25053 3.57023 4.25H4.16023ZM3.90023 10.11V13.63H1.73023V10.11H3.90023ZM4.91023 14.63V9.11H1.73023V7.68C2.60075 7.56798 3.40958 7.17058 4.0302 6.54996C4.65082 5.92934 5.04822 5.12051 5.16023 4.25H11.6402C11.9123 5.29826 12.0864 6.36953 12.1602 7.45C12.1702 8.07 12.1602 8.62 12.1202 9.12C12.0802 9.12 12.0402 9.11 12.0002 9.11C11.2677 9.10897 10.5585 9.36791 9.99894 9.84073C9.43938 10.3136 9.06575 10.9696 8.94454 11.6921C8.82332 12.4145 8.9624 13.1566 9.337 13.7861C9.71161 14.4157 10.2974 14.8919 10.9902 15.13C10.8877 15.9225 10.8376 16.7209 10.8402 17.52C10.8391 18.2559 10.9504 18.9877 11.1702 19.69H5.15023C5.03045 18.8292 4.63063 18.0318 4.01251 17.4209C3.39439 16.8101 2.59235 16.4196 1.73023 16.31V14.64H4.90023L4.91023 14.63ZM13.0102 10.37C13.4134 10.5835 13.7355 10.9231 13.9274 11.3369C14.1193 11.7507 14.1704 12.216 14.0729 12.6616C13.9754 13.1073 13.7346 13.5087 13.3874 13.8045C13.0402 14.1004 12.6057 14.2744 12.1502 14.3C12.2602 13.75 12.3802 13.25 12.5102 12.74C12.717 11.959 12.8839 11.168 13.0102 10.37ZM11.5402 12.49C11.4102 13.01 11.2802 13.54 11.1602 14.13C10.7201 13.935 10.3603 13.5947 10.1411 13.1661C9.92198 12.7375 9.85672 12.2466 9.95631 11.7756C10.0559 11.3046 10.3143 10.8821 10.6882 10.5789C11.0621 10.2757 11.5288 10.1101 12.0102 10.11H12.0302C11.9145 10.9124 11.7509 11.7071 11.5402 12.49ZM1.73023 17.85V17.31C2.32782 17.4134 2.87964 17.6967 3.31204 18.1219C3.74444 18.5472 4.03685 19.0942 4.15023 19.69H3.57023C3.0824 19.6895 2.61469 19.4954 2.26974 19.1505C1.92479 18.8055 1.73076 18.3378 1.73023 17.85ZM20.4202 19.69H19.8402C19.944 19.086 20.2325 18.529 20.6658 18.0956C21.0992 17.6622 21.6562 17.3738 22.2602 17.27V17.85C22.2597 18.3378 22.0657 18.8055 21.7207 19.1505C21.3758 19.4954 20.9081 19.6895 20.4202 19.69ZM22.2602 13.63H20.0902V10.11H22.2602V13.63ZM19.0902 9.11V14.63H22.2602V16.26C21.3916 16.3701 20.5843 16.7659 19.9652 17.385C19.3461 18.0041 18.9504 18.8114 18.8402 19.68H12.2102C11.9598 18.9839 11.8313 18.2498 11.8302 17.51C11.827 16.7713 11.8704 16.0332 11.9602 15.3H11.9902C12.7116 15.295 13.4086 15.0386 13.9613 14.575C14.5139 14.1114 14.8876 13.4695 15.0179 12.76C15.1482 12.0505 15.0269 11.3177 14.6751 10.688C14.3232 10.0583 13.7628 9.57095 13.0902 9.31C13.1391 8.67792 13.1558 8.04377 13.1402 7.41C13.0708 6.33698 12.9035 5.27255 12.6402 4.23H18.8202C18.9182 5.11293 19.3094 5.93753 19.9311 6.57201C20.5529 7.20648 21.3695 7.6142 22.2502 7.73V9.1H19.0802L19.0902 9.11Z' fill='%231F212B'/%3E%3C/svg%3E",
    history: "data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11.001 21.4999C10.6876 21.4985 10.3825 21.3989 10.1285 21.2152C9.87454 21.0316 9.68445 20.7732 9.58499 20.476H3.00101C2.60017 20.4723 2.21714 20.3095 1.93595 20.0238C1.65475 19.7381 1.49835 19.3529 1.50101 18.952V5.63172C1.49835 5.23086 1.65475 4.84563 1.93595 4.55994C2.21714 4.27425 2.60017 4.11149 3.00101 4.10779H3.55802C3.58383 3.78404 3.71446 3.47762 3.93009 3.23474C4.14572 2.99187 4.4346 2.82606 4.75302 2.76209C6.91879 2.41394 9.12626 2.41394 11.292 2.76209C11.3724 2.88213 11.481 2.98018 11.6084 3.04822C11.7358 3.11626 11.8781 3.15223 12.0225 3.15223C12.1669 3.15223 12.3091 3.11626 12.4366 3.04822C12.564 2.98018 12.6727 2.88213 12.753 2.76209C14.9185 2.41464 17.1255 2.41464 19.291 2.76209C19.6099 2.82601 19.8994 2.99148 20.1159 3.23426C20.3323 3.47703 20.464 3.78367 20.491 4.10779H21.004C21.4049 4.11123 21.7881 4.2737 22.0694 4.55945C22.3506 4.8452 22.5069 5.23079 22.504 5.63172V18.952C22.5069 19.353 22.3506 19.7385 22.0694 20.0243C21.7881 20.31 21.4049 20.4725 21.004 20.476H14.421C14.3204 20.7733 14.1295 21.0316 13.875 21.2152C13.6204 21.3988 13.3149 21.4983 13.001 21.4999H11.001ZM2.50101 5.63172V18.952C2.49832 19.0876 2.54941 19.2188 2.6431 19.3168C2.73679 19.4148 2.86547 19.4716 3.00101 19.475H10.001C10.1336 19.475 10.2608 19.5277 10.3546 19.6215C10.4484 19.7152 10.501 19.8424 10.501 19.975C10.4978 20.1109 10.5486 20.2423 10.6424 20.3407C10.7361 20.4391 10.8651 20.4965 11.001 20.4999H13.001C13.1368 20.4962 13.2657 20.4391 13.3593 20.3407C13.453 20.2423 13.504 20.1108 13.501 19.975C13.501 19.8424 13.5537 19.7152 13.6474 19.6215C13.7412 19.5277 13.8684 19.475 14.001 19.475H21.001C21.1366 19.4718 21.2655 19.4148 21.3592 19.3168C21.453 19.2187 21.504 19.0877 21.501 18.952V5.63172C21.5042 5.49582 21.4534 5.36443 21.3597 5.26599C21.2659 5.16756 21.1369 5.11022 21.001 5.10682H20.522V17.432C20.5263 17.6261 20.489 17.8185 20.4128 17.997C20.3366 18.1754 20.2231 18.3356 20.08 18.4667C19.9555 18.5765 19.8088 18.6585 19.6498 18.7064C19.4909 18.7544 19.3235 18.7676 19.159 18.745C16.9601 18.3768 14.7139 18.3942 12.521 18.7968C12.382 18.8188 12.252 18.8367 12.105 18.8627L12.022 18.8768L11.939 18.8627C11.792 18.8367 11.663 18.8198 11.523 18.7968C9.33045 18.3941 7.08459 18.3768 4.88602 18.745C4.72137 18.7685 4.55356 18.7554 4.39432 18.7074C4.23509 18.6594 4.08826 18.5773 3.96402 18.4667C3.82075 18.3357 3.70719 18.176 3.63095 17.9974C3.55472 17.8189 3.51755 17.6261 3.52201 17.432V5.10682H3.00199C2.86627 5.11048 2.73753 5.16786 2.64371 5.26599C2.54989 5.36413 2.49859 5.49597 2.50101 5.63172ZM12.886 3.75281C12.7735 3.7959 12.6775 3.87377 12.6121 3.97498C12.5467 4.07619 12.5151 4.19548 12.522 4.3158V17.7787C14.7608 17.3862 17.0501 17.3773 19.292 17.7518C19.3151 17.7551 19.3385 17.7533 19.3609 17.747C19.3833 17.7406 19.4041 17.7296 19.422 17.7147C19.4572 17.6767 19.4841 17.6322 19.5013 17.5834C19.5185 17.5345 19.5256 17.4827 19.522 17.431V4.3158C19.5286 4.19553 19.4969 4.07613 19.4316 3.97498C19.3662 3.87383 19.2704 3.79616 19.158 3.75281C17.081 3.41497 14.963 3.41497 12.886 3.75281ZM11.523 17.7797V4.31678C11.5299 4.19645 11.4984 4.07716 11.433 3.97596C11.3675 3.87475 11.2716 3.79688 11.159 3.75379C9.08205 3.41545 6.96397 3.41545 4.887 3.75379C4.77462 3.79714 4.67889 3.8753 4.6135 3.97644C4.5481 4.07759 4.51639 4.19651 4.52298 4.31678V17.432C4.51966 17.4836 4.52686 17.5351 4.54404 17.5839C4.56122 17.6327 4.58808 17.6775 4.62302 17.7157C4.64024 17.7317 4.66097 17.7435 4.68357 17.7499C4.70616 17.7563 4.72997 17.7573 4.75302 17.7528C5.87883 17.5848 7.01478 17.4939 8.15299 17.4808C9.28243 17.4911 10.4093 17.5915 11.523 17.7797Z' fill='%231F212B'/%3E%3C/svg%3E",
    referee: "data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 3C4.45 3 4 3.45 4 4V20C4 20.55 4.45 21 5 21H11C11.55 21 12 20.55 12 20V4C12 3.45 11.55 3 11 3H5ZM10 19H6V13H10V19ZM10 11H6V5H10V11Z' fill='%231F212B'/%3E%3Cpath d='M19 3H13C12.45 3 12 3.45 12 4V20C12 20.55 12.45 21 13 21H19C19.55 21 20 20.55 20 20V4C20 3.45 19.55 3 19 3ZM18 19H14V13H18V19ZM18 11H14V5H18V11Z' fill='%231F212B'/%3E%3C/svg%3E",
    ranking: "data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7.5 21H2V9H7.5V21ZM14.75 3H9.25V21H14.75V3ZM22 11H16.5V21H22V11Z' fill='%231F212B'/%3E%3C/svg%3E",
    tick: "data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8.8998 17.9C8.5998 17.9 8.2998 17.8 8.0998 17.6L3.6998 13.2C3.4998 13 3.4998 12.7 3.6998 12.5C3.8998 12.3 4.1998 12.3 4.3998 12.5L8.7998 16.9C8.7998 16.9 8.7998 16.9 8.8998 16.9L19.3998 6.4C19.5998 6.2 19.8998 6.2 20.0998 6.4C20.2998 6.6 20.2998 6.9 20.0998 7.1L9.5998 17.6C9.39981 17.8 9.0998 17.9 8.7998 17.9H8.8998Z' fill='%231F212B'/%3E%3C/svg%3E",
    lock: "data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M17.471 9.87481V6.48181C17.4515 5.039 16.8647 3.66188 15.8375 2.64848C14.8104 1.63508 13.4254 1.06689 11.9825 1.06689C10.5396 1.06689 9.15465 1.63508 8.12747 2.64848C7.1003 3.66188 6.51348 5.039 6.494 6.48181V9.87481C5.832 9.8764 5.19765 10.1405 4.73011 10.6092C4.26257 11.0778 4 11.7128 4 12.3748V20.4278C4 21.0908 4.26339 21.7267 4.73223 22.1956C5.20107 22.6644 5.83696 22.9278 6.5 22.9278H17.466C18.129 22.9278 18.7649 22.6644 19.2338 22.1956C19.7026 21.7267 19.966 21.0908 19.966 20.4278V12.3748C19.966 11.7126 19.7033 11.0775 19.2355 10.6088C18.7678 10.1401 18.1332 9.87613 17.471 9.87481ZM11.983 1.99881C13.1723 1.99934 14.3127 2.47166 15.1541 3.31213C15.9955 4.1526 16.4691 5.29255 16.471 6.48181V9.87481H7.494V6.48181C7.49612 5.29245 7.96994 4.15251 8.8115 3.31207C9.65306 2.47163 10.7936 1.99934 11.983 1.99881ZM18.966 20.4238C18.966 20.8216 18.808 21.2032 18.5267 21.4845C18.2454 21.7658 17.8638 21.9238 17.466 21.9238H6.5C6.10218 21.9238 5.72064 21.7658 5.43934 21.4845C5.15804 21.2032 5 20.8216 5 20.4238V12.3748C5 11.977 5.15804 11.5955 5.43934 11.3141C5.72064 11.0328 6.10218 10.8748 6.5 10.8748H17.466C17.8638 10.8748 18.2454 11.0328 18.5267 11.3141C18.808 11.5955 18.966 11.977 18.966 12.3748V20.4238Z' fill='%231F212B'/%3E%3C/svg%3E",
  };

  fdsIconStyle(name: string): Record<string, string> {
    const uri = this.fdsIcons[name] ?? '';
    return {
      'mask-image': `url("${uri}")`,
      '-webkit-mask-image': `url("${uri}")`,
    };
  }

  readonly flowCards: ReadonlyArray<QuizFlowCard> = [
    {
      id: 'the-connector',
      title: 'The Connector',
      subtitle: '5 questions · Quiz',
      iconClass: 'language',
      route: '/quiz',
      routeState: { quizId: 'the-connector' },
      type: 'quiz',
    },
    {
      id: 'the-architect',
      title: 'The Architect',
      subtitle: '5 rounds · Card Match',
      iconClass: 'stadium',
      route: '/card-match',
      routeState: { flowId: 'the-architect' },
      type: 'card_match',
    },
    {
      id: 'the-historian',
      title: 'The Historian',
      subtitle: '5 questions · Ranking',
      iconClass: 'history',
      route: '/ranking-quiz',
      routeState: { quizId: 'the-historian' },
      type: 'ranking',
    },
    {
      id: 'the-referee',
      title: 'The Referee',
      subtitle: '10 statements · Swipe',
      iconClass: 'referee',
      route: '/swipe-quiz',
      routeState: { quizId: 'the-referee' },
      type: 'swipe',
    },
    {
      id: 'the-retrospective',
      title: 'The Retrospective',
      subtitle: '5 questions · Spin Wheel',
      iconClass: 'ranking',
      route: '/spin-wheel-quiz',
      routeState: { quizId: 'the-retrospective' },
      type: 'spin_wheel',
    },
  ];

  readonly milestones = computed<JourneyMilestone[]>(() => {
    const completedCount = this.state().completedFlows.length;
    return [
      {
        iconClass: 'profile',
        label: 'Fan card',
        completed: this.isCardComplete(),
      },
      {
        iconClass: 'language',
        label: '1st quiz',
        completed: completedCount >= 1,
      },
      {
        iconClass: 'stadium',
        label: '3 quizzes',
        completed: completedCount >= 3,
      },
      {
        iconClass: 'star',
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
