import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { WORLD_CUP_TEAMS, type WorldCupTeam } from '../data/teams';
import { AnalyticsService } from '../services/analytics.service';
import { AuthService } from '../services/auth.service';
import { StoreService } from '../services/store.service';

interface LandingCardVisual {
  team: WorldCupTeam;
  rotate: string;
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
            [style.transform]="'rotate(' + card.rotate + ')'"
            [style.background]="teamGradient(card.team)"
          >
            <div class="landing-page__card-header">
              <p class="landing-page__card-eyebrow">Your fan card</p>
              <p class="landing-page__card-caption">Collector edition</p>
            </div>
            <p class="landing-page__card-team">
              <span aria-hidden="true">{{ card.team.flag }}</span>
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
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: var(--c-lt-bg);
        padding: var(--sp-20) var(--sp-4) var(--sp-10);
        gap: var(--sp-6);
      }

      .landing-page__title {
        margin: 0;
        max-width: calc(var(--sp-20) * 4 + var(--sp-2));
        text-align: center;
        color: var(--c-lt-text-1);
        font: var(--f-brand-type-title-2);
      }

      .landing-page__stack {
        width: 100%;
        max-width: calc(var(--sp-20) * 4 + var(--sp-2));
        display: grid;
        place-items: center;
      }

      .landing-page__card {
        grid-area: 1 / 1;
        width: min(100%, calc(var(--sp-20) * 3 + var(--sp-2)));
        aspect-ratio: 5 / 7;
        border-radius: var(--f-brand-radius-inner);
        border: var(--f-brand-border-size-default) solid var(--f-brand-color-border-default);
        box-shadow: var(--f-brand-shadow-large);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: var(--sp-3);
        padding: var(--sp-6) var(--sp-5);
        color: var(--f-brand-color-text-light);
      }

      .landing-page__card:first-child {
        width: min(100%, calc(var(--sp-20) * 3));
      }

      .landing-page__card-header {
        display: flex;
        flex-direction: column;
        gap: var(--sp-1);
      }

      .landing-page__card-eyebrow {
        margin: 0;
        font: var(--f-brand-type-caption);
        color: var(--f-brand-color-text-light);
        text-transform: uppercase;
        letter-spacing: var(--tracking-display);
      }

      .landing-page__card-caption {
        margin: 0;
        font: var(--f-brand-type-caption);
        color: var(--c-text-mid);
        letter-spacing: var(--tracking-wide);
      }

      .landing-page__card-team {
        margin: 0;
        display: inline-flex;
        align-items: center;
        gap: var(--sp-2);
        font: var(--f-brand-type-headline-medium);
        font-style: italic;
      }

      .landing-page__cta {
        margin-top: auto;
        width: 100%;
        max-width: calc(var(--sp-20) * 4 + var(--sp-2));
        min-height: var(--sp-12);
        border: none;
        border-radius: var(--f-brand-radius-rounded);
        background: var(--f-brand-color-background-primary);
        color: var(--f-brand-color-text-light);
        font: var(--f-brand-type-body-medium);
        cursor: pointer;
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
    { team: this.stackTeams[0], rotate: '5deg' },
    { team: this.stackTeams[1], rotate: '-3deg' },
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
