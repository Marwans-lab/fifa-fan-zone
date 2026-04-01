import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { WORLD_CUP_TEAMS, type WorldCupTeam } from '../data/teams';
import { AnalyticsService } from '../services/analytics.service';
import { AuthService } from '../services/auth.service';
import { StoreService } from '../services/store.service';

interface LandingCardVisual {
  team: WorldCupTeam;
  width: number;
  height: number;
  rotate: string;
  zIndex: number;
}

@Component({
  standalone: true,
  template: `
    <main class="landing-page f-page-enter" data-page="landing">
      <h1 class="landing-page__title">
        You could win tickets to FIFA World Cup 2026
      </h1>

      <section class="landing-page__stack" aria-hidden="true">
        @for (card of cards; track card.team.id) {
          <article
            class="landing-page__card"
            [style.width.px]="card.width"
            [style.height.px]="card.height"
            [style.transform]="'rotate(' + card.rotate + ')'"
            [style.background]="teamGradient(card.team)"
            [style.z-index]="card.zIndex"
          >
            <div class="landing-page__texture-dots"></div>
            <div class="landing-page__texture-stripes"></div>
            <div class="landing-page__texture-holographic"></div>

            <div class="landing-page__card-header">
              <p class="landing-page__card-eyebrow">Your fan card</p>
              <p class="landing-page__card-caption">Collector edition</p>
            </div>

            <div
              class="landing-page__card-avatar"
              [style.width.px]="card.width * 0.45"
              [style.height.px]="card.width * 0.45"
            >
              <span
                class="landing-page__card-avatar-flag"
                aria-hidden="true"
                [style.font-size.px]="card.width * 0.18"
              >
                {{ card.team.flag }}
              </span>
            </div>

            <p class="landing-page__card-team">
              <span class="landing-page__card-team-flag" aria-hidden="true">{{ card.team.flag }}</span>
              {{ card.team.name }}
            </p>
          </article>
        }
      </section>

      <button
        class="landing-page__cta"
        data-ui="primary-cta-btn"
        type="button"
        (click)="handlePrimaryCta()"
      >
        {{ hasCard() ? 'View your fan card' : 'Create your fan card' }}
      </button>
    </main>
  `,
  styles: [
    `
      .landing-page {
        min-height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: var(--f-brand-color-background-default);
        padding: var(--sp-20) var(--f-brand-space-md) var(--f-brand-space-2xl);
        box-sizing: border-box;
      }

      .landing-page__title {
        margin: 0;
        max-width: 361px;
        text-align: center;
        color: var(--f-brand-color-text-default);
        font: var(--f-brand-type-title-2);
      }

      .landing-page__stack {
        margin-top: var(--f-brand-space-lg);
        width: 100%;
        max-width: 340px;
        display: grid;
        place-items: center;
        aspect-ratio: 340 / 440;
        margin-inline: auto;
      }

      .landing-page__card {
        grid-area: 1 / 1;
        border-radius: var(--f-brand-radius-inner);
        border: var(--f-brand-border-size-default) solid var(--f-brand-color-border-subtle);
        box-shadow: 0 8px 32px var(--f-brand-shadow-medium);
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: var(--sp-6) var(--sp-5) var(--sp-5);
      }

      .landing-page__card-header {
        position: relative;
        z-index: 1;
        width: 100%;
        display: flex;
        flex-direction: column;
      }

      .landing-page__card-eyebrow {
        margin: 0;
        font: var(--f-brand-type-caption);
        font-size: var(--text-sm);
        color: var(--f-brand-color-background-light);
        text-transform: uppercase;
        letter-spacing: var(--tracking-display);
      }

      .landing-page__card-caption {
        margin: 0;
        font: var(--f-brand-type-caption);
        font-size: var(--text-2xs);
        color: var(--c-text-mid);
        letter-spacing: var(--tracking-spaced);
      }

      .landing-page__card-avatar {
        border-radius: 50%;
        background: var(--f-brand-color-background-dark-40a);
        border: 3px solid rgba(255, 255, 255, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 1;
      }

      .landing-page__card-team {
        margin: 0;
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        font: var(--f-brand-type-headline-medium);
        font-style: italic;
        color: var(--c-text-hi);
        letter-spacing: var(--tracking-label);
        position: relative;
        z-index: 1;
      }

      .landing-page__card-team-flag {
        font-size: var(--text-xl);
        font-style: normal;
      }

      .landing-page__texture-dots,
      .landing-page__texture-stripes {
        position: absolute;
        inset: 0;
        border-radius: var(--f-brand-radius-inner);
        pointer-events: none;
      }

      .landing-page__texture-dots {
        background-image: radial-gradient(circle, rgba(255, 255, 255, 0.28) 1.5px, transparent 1.5px);
        background-size: 16px 16px;
        mix-blend-mode: overlay;
      }

      .landing-page__texture-stripes {
        background-image:
          repeating-linear-gradient(
            -55deg,
            transparent,
            transparent 18px,
            rgba(255, 255, 255, 0.1) 18px,
            rgba(255, 255, 255, 0.1) 19px
          );
        mix-blend-mode: overlay;
      }

      .landing-page__texture-holographic {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: var(--sp-1);
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
        pointer-events: none;
      }

      .landing-page__cta {
        margin-top: var(--f-brand-space-2xl);
        width: 100%;
        max-width: 361px;
        height: var(--sp-14);
        border: none;
        border-radius: var(--f-brand-radius-rounded);
        background: var(--f-brand-color-primary);
        color: var(--f-brand-color-background-light);
        font: var(--f-brand-type-body-medium);
        font-size: var(--text-md);
        cursor: pointer;
        padding: var(--f-brand-space-md) var(--f-brand-space-xl);
        box-shadow: none;
        -webkit-tap-highlight-color: transparent;
        transition: background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
      }

      .landing-page__cta:hover {
        background: var(--f-brand-color-background-primary-hover);
      }

      .landing-page__cta:focus-visible {
        outline: var(--f-brand-border-size-focused) solid var(--f-brand-color-border-primary);
        outline-offset: var(--f-brand-space-2xs);
      }

      @media (prefers-reduced-motion: reduce) {
        .landing-page__cta {
          transition-duration: 0ms;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage implements OnInit {
  private readonly router = inject(Router);
  private readonly store = inject(StoreService);
  private readonly analytics = inject(AnalyticsService);
  private readonly authService = inject(AuthService);

  private readonly stackTeams = [
    WORLD_CUP_TEAMS.find(team => team.id === 'bra') ?? WORLD_CUP_TEAMS[0],
    WORLD_CUP_TEAMS.find(team => team.id === 'arg') ?? WORLD_CUP_TEAMS[1] ?? WORLD_CUP_TEAMS[0],
  ];

  readonly cards: LandingCardVisual[] = [
    { team: this.stackTeams[0], width: 272, height: 388, rotate: '5deg', zIndex: 1 },
    { team: this.stackTeams[1], width: 301, height: 430, rotate: '-3deg', zIndex: 2 },
  ];

  readonly hasCard = computed(() => Boolean(this.store.state().fanCard.teamId));

  ngOnInit(): void {
    this.analytics.track('landing_viewed', { hasCard: this.hasCard() });
    void this.authService.fetchAuthToken();
  }

  handlePrimaryCta(): void {
    const hasCard = this.hasCard();
    this.analytics.track('landing_primary_cta_tapped', { hasCard });
    void this.router.navigateByUrl(hasCard ? '/card' : '/team-selection');
  }

  teamGradient(team: WorldCupTeam): string {
    return `linear-gradient(160deg, ${team.colors[0]}, ${team.colors[1]})`;
  }
}
