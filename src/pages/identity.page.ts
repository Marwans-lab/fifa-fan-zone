import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ScreenComponent } from '../components/screen/screen.component';
import { WORLD_CUP_TEAMS, getTeam, type WorldCupTeam } from '../data/teams';
import { AnalyticsService } from '../services/analytics.service';
import { StoreService } from '../services/store.service';

type Step = 'team' | 'preview';

@Component({
  standalone: true,
  imports: [CommonModule, ScreenComponent],
  template: `
    <app-screen [style]="screenStyle">
      <main class="identity-page f-page-enter" data-page="identity">
        @if (step() === 'team') {
          <section class="identity-page__team-step">
            <header class="identity-page__header" data-section="header">
              <h2 class="identity-page__title">Choose your team</h2>
              <p class="identity-page__subtitle">Select the country you're supporting</p>
            </header>

            <div class="identity-page__search-wrap" data-section="search">
              <input
                class="f-input identity-page__search-input"
                data-ui="team-search-input"
                type="text"
                placeholder="Search teams…"
                [value]="query()"
                (input)="handleQueryInput($event)"
              />
            </div>

            <div class="identity-page__team-list scroll-y f-stagger" data-section="team-grid">
              @for (team of filteredTeams(); track team.id) {
                <button
                  class="identity-page__team-option glass-row"
                  type="button"
                  data-ui="team-option-btn"
                  (click)="handleTeamSelect(team)"
                >
                  <span
                    class="identity-page__team-swatch"
                    [style.background]="
                      'linear-gradient(135deg, ' + team.colors[0] + ' 0%, ' + team.colors[1] + ' 100%)'
                    "
                  >
                    <i class="ic-nav-flag-{{team.flag}}" aria-hidden="true"></i>
                  </span>
                  <span class="identity-page__team-name">{{ team.name }}</span>
                  <span class="identity-page__team-chevron" aria-hidden="true">›</span>
                </button>
              }

              @if (filteredTeams().length === 0) {
                <p class="identity-page__empty">No teams found — try another search.</p>
              }
            </div>
          </section>
        } @else {
          @if (selectedTeam(); as team) {
            <section class="identity-page__preview-step">
              <h2 class="identity-page__title identity-page__title--centered">Looking good!</h2>
              <p class="identity-page__subtitle identity-page__subtitle--centered">
                Your fan card is ready
              </p>

              <div class="identity-page__preview-card-wrap" data-section="card-preview">
                <article
                  class="identity-page__preview-card"
                  [style.background]="selectedTeamGradient()"
                >
                  <div class="identity-page__preview-stripe"></div>

                  <header class="identity-page__preview-header">
                    <p class="identity-page__preview-kicker">FIFA Fan Zone</p>
                    <p class="identity-page__preview-caption">Collector edition</p>
                  </header>

                  <div class="identity-page__preview-photo-wrap">
                    @if (photoDataUrl()) {
                      <img
                        class="identity-page__preview-photo"
                        [src]="photoDataUrl()"
                        alt="Your photo"
                      />
                    } @else {
                      <div class="identity-page__preview-photo-placeholder">
                        <img
                          class="identity-page__preview-camera-icon"
                          src="assets/icons/camera-white.svg"
                          width="24"
                          height="24"
                          alt=""
                        />
                        <span class="identity-page__preview-placeholder-label">Take photo</span>
                      </div>
                    }
                  </div>

                  <footer class="identity-page__preview-footer">
                    <p class="identity-page__preview-motto">{{ team.motto }}</p>
                  </footer>
                </article>
              </div>

              <p class="identity-page__login-prompt">
                Already have a card? <span class="identity-page__login-link">Log in</span>
              </p>

              <div class="identity-page__actions">
                <button
                  class="f-button identity-page__action-btn"
                  type="button"
                  data-ui="save-fan-card-btn"
                  (click)="handleSaveFanCard()"
                >
                  Save fan card
                </button>
                <button
                  class="f-button f-button--secondary identity-page__action-btn"
                  type="button"
                  data-ui="retake-photo-btn"
                  (click)="handleRetakePhoto()"
                >
                  Retake photo
                </button>
              </div>
            </section>
          } @else {
            <section class="identity-page__preview-step">
              <p class="identity-page__empty">Choose a team to continue.</p>
            </section>
          }
        }
      </main>
    </app-screen>
  `,
  styles: [
    `
      .identity-page {
        min-height: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--sp-6) var(--sp-4) var(--sp-4);
        background: var(--c-bg);
        color: var(--c-text-1);
      }

      .identity-page__team-step,
      .identity-page__preview-step {
        display: flex;
        flex-direction: column;
        min-height: 100%;
      }

      .identity-page__header {
        margin-bottom: var(--sp-4);
      }

      .identity-page__title,
      .identity-page__subtitle {
        margin: 0;
      }

      .identity-page__title {
        font: var(--f-brand-type-title-3);
        color: var(--c-text-1);
      }

      .identity-page__title--centered,
      .identity-page__subtitle--centered {
        text-align: center;
      }

      .identity-page__subtitle {
        margin-top: var(--sp-1);
        font: var(--f-brand-type-subheading);
        color: var(--c-text-2);
      }

      .identity-page__search-wrap {
        margin-bottom: var(--sp-3);
      }

      .identity-page__search-input {
        width: 100%;
        background: var(--c-surface);
        border-color: var(--c-border);
        color: var(--c-text-1);
      }

      .identity-page__search-input::placeholder {
        color: var(--c-text-3);
      }

      .identity-page__team-list {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--sp-2);
        padding-bottom: var(--sp-4);
      }

      .identity-page__team-option {
        width: 100%;
        min-height: var(--sp-12);
        border-radius: var(--r-md);
        border: var(--f-brand-border-size-default) solid var(--c-border);
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        padding: var(--sp-3) var(--sp-4);
        color: var(--c-text-1);
        cursor: pointer;
        text-align: left;
      }

      .identity-page__team-option:focus-visible {
        outline: var(--f-brand-border-size-focused) solid var(--c-accent);
        outline-offset: var(--sp-1);
      }

      .identity-page__team-swatch {
        width: var(--sp-8);
        min-height: var(--sp-8);
        border-radius: var(--r-full);
        border: var(--f-brand-border-size-default) solid var(--c-border);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: var(--text-md);
      }

      .identity-page__team-name {
        flex: 1;
        font: var(--f-brand-type-body);
      }

      .identity-page__team-chevron {
        color: var(--c-text-2);
        font-size: var(--text-base);
      }

      .identity-page__preview-step {
        max-width: 340px;
        width: 100%;
        margin: 0 auto;
      }

      .identity-page__preview-card-wrap {
        margin-top: var(--sp-6);
      }

      .identity-page__preview-card {
        width: 100%;
        aspect-ratio: 300 / 420;
        border-radius: var(--f-brand-radius-outer);
        border: var(--f-brand-border-size-default) solid var(--c-border);
        box-shadow: var(--shadow-lg);
        padding: var(--sp-6) var(--sp-5) var(--sp-5);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        position: relative;
        overflow: hidden;
      }

      .identity-page__preview-stripe {
        position: absolute;
        inset: 0 0 auto 0;
        height: var(--sp-1);
        background: linear-gradient(
          90deg,
          transparent 0%,
          var(--c-text-mid) 50%,
          transparent 100%
        );
      }

      .identity-page__preview-header {
        position: relative;
        z-index: 1;
        text-align: center;
      }

      .identity-page__preview-kicker,
      .identity-page__preview-caption,
      .identity-page__preview-motto {
        margin: 0;
      }

      .identity-page__preview-kicker {
        font-size: var(--text-2xs);
        letter-spacing: var(--tracking-display-wide);
        color: var(--c-text-mid);
        text-transform: uppercase;
      }

      .identity-page__preview-caption {
        margin-top: var(--sp-1);
        font-size: var(--text-xs);
        letter-spacing: var(--tracking-spaced);
        color: var(--c-text-dim);
      }

      .identity-page__preview-photo-wrap {
        z-index: 1;
      }

      .identity-page__preview-photo,
      .identity-page__preview-photo-placeholder {
        width: calc(var(--sp-20) + var(--sp-10));
        min-height: calc(var(--sp-20) + var(--sp-10));
        border-radius: var(--r-full);
      }

      .identity-page__preview-photo {
        object-fit: cover;
        object-position: top;
        border: var(--f-brand-border-size-focused) solid var(--c-border-raise);
      }

      .identity-page__preview-photo-placeholder {
        border: var(--c-photo-placeholder-border);
        background: var(--c-surface);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--sp-2);
      }

      .identity-page__preview-camera-icon {
        display: block;
      }

      .identity-page__preview-placeholder-label {
        font-size: var(--text-3xs);
        letter-spacing: var(--tracking-display);
        line-height: var(--leading-close);
        text-transform: uppercase;
        color: var(--c-text-hi);
      }

      .identity-page__preview-footer {
        z-index: 1;
      }

      .identity-page__preview-motto {
        text-align: center;
        font: var(--f-brand-type-headline-medium);
        font-size: var(--text-sm);
        letter-spacing: var(--tracking-spaced);
        color: var(--c-text-hi);
        font-style: italic;
      }

      .identity-page__login-prompt {
        margin: var(--sp-6) 0 0;
        text-align: center;
        font: var(--f-brand-type-subheading);
        color: var(--c-text-2);
      }

      .identity-page__login-link {
        color: var(--c-text-1);
        font-weight: var(--weight-med);
      }

      .identity-page__actions {
        margin-top: var(--sp-4);
        display: flex;
        flex-direction: column;
        gap: var(--sp-3);
      }

      .identity-page__action-btn {
        width: 100%;
      }

      .identity-page__empty {
        margin: var(--sp-3) 0 0;
        text-align: center;
        font: var(--f-brand-type-subheading);
        color: var(--c-text-2);
      }

      @media (prefers-reduced-motion: reduce) {
        .identity-page,
        .identity-page * {
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
export class IdentityPage {
  private readonly router = inject(Router);
  private readonly store = inject(StoreService);
  private readonly analytics = inject(AnalyticsService);

  readonly screenStyle: Record<string, string> = {
    background: 'var(--c-bg)',
  };

  readonly query = signal('');
  readonly selectedTeamId = signal<string | null>(this.getIncomingState('teamId') ?? this.store.state().fanCard.teamId);
  readonly photoDataUrl = signal<string | null>(
    this.getIncomingState('photoDataUrl') ?? this.store.state().fanCard.photoDataUrl
  );
  readonly step = signal<Step>(this.selectedTeamId() ? 'preview' : 'team');

  readonly filteredTeams = computed(() => {
    const normalizedQuery = this.query().trim().toLowerCase();
    if (!normalizedQuery) {
      return WORLD_CUP_TEAMS;
    }
    return WORLD_CUP_TEAMS.filter(team => team.name.toLowerCase().includes(normalizedQuery));
  });

  readonly selectedTeam = computed<WorldCupTeam | null>(() => {
    const teamId = this.selectedTeamId();
    if (!teamId) {
      return null;
    }
    return getTeam(teamId) ?? null;
  });

  handleQueryInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.query.set(target.value);
  }

  handleTeamSelect(team: WorldCupTeam): void {
    this.selectedTeamId.set(team.id);
    this.photoDataUrl.set(null);
    this.step.set('preview');
    this.store.updateFanCard({
      teamId: team.id,
      photoDataUrl: null,
    });
    this.analytics.track('identity_team_selected', { teamId: team.id });
  }

  selectedTeamGradient(): string {
    const team = this.selectedTeam();
    if (!team) {
      return 'linear-gradient(160deg, var(--c-card-gradient-1) 0%, var(--c-card-gradient-3) 100%)';
    }
    return `linear-gradient(160deg, ${team.colors[0]} 0%, ${team.colors[1]} 100%)`;
  }

  handleSaveFanCard(): void {
    const teamId = this.selectedTeamId();
    if (!teamId) {
      this.step.set('team');
      return;
    }

    this.store.updateFanCard({
      teamId,
      photoDataUrl: this.photoDataUrl(),
    });
    this.analytics.track('identity_continue_tapped', { teamId });
    void this.router.navigateByUrl('/card');
  }

  handleRetakePhoto(): void {
    const teamId = this.selectedTeamId();
    if (!teamId) {
      this.step.set('team');
      return;
    }
    this.photoDataUrl.set(null);
    this.analytics.track('identity_retake_tapped', { teamId });
    void this.router.navigateByUrl('/team-selection');
  }

  private getIncomingState(key: 'teamId' | 'photoDataUrl'): string | null {
    const historyState = window.history.state as Record<string, unknown> | null;
    const value = historyState?.[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
