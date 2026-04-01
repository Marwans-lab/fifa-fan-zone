import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { FanCardComponent } from '../components/fan-card/fan-card.component';
import { ScreenComponent } from '../components/screen/screen.component';
import { WORLD_CUP_TEAMS } from '../data/teams';
import { FanCard } from '../models/fan-card.model';
import { AnalyticsService } from '../services/analytics.service';
import { StoreService } from '../services/store.service';

type Step = 'team' | 'preview';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ScreenComponent, FanCardComponent],
  template: `
    @if (step() === 'team') {
      <app-screen [style]="screenStyle">
        <main class="identity-page identity-page--team f-page-enter" data-page="identity">
          <section class="identity-page__header" data-section="header">
            <h2 class="identity-page__title">Choose your team</h2>
            <p class="identity-page__subtitle">Select the country you're supporting</p>
          </section>

          <section class="identity-page__search" data-section="search">
            <input
              class="f-input identity-page__search-input"
              data-ui="team-search-input"
              type="text"
              placeholder="Search teams…"
              [ngModel]="query()"
              (ngModelChange)="query.set($event)"
            />
          </section>

          <section class="identity-page__team-list scroll-y stagger" data-section="team-grid">
            @for (team of filteredTeams(); track team.id) {
              <button
                type="button"
                class="identity-page__team-row"
                data-ui="team-option-btn"
                (click)="handleTeamSelect(team.id)"
              >
                <div
                  class="identity-page__team-swatch"
                  [style.background]="'linear-gradient(135deg, ' + team.colors[0] + ', ' + team.colors[1] + ')'"
                >
                  {{ team.flag }}
                </div>
                <span class="identity-page__team-name">{{ team.name }}</span>
                <span class="identity-page__team-chevron" aria-hidden="true">›</span>
              </button>
            }
          </section>
        </main>
      </app-screen>
    } @else {
      <app-screen [centered]="true" [style]="screenStyle">
        <main class="identity-page identity-page--preview f-page-enter" data-page="identity">
          <h2 class="identity-page__title">Looking good!</h2>
          <p class="identity-page__subtitle">Your fan card is ready</p>

          <section class="identity-page__card-wrap" data-section="card-preview">
            <app-fan-card [fanCard]="previewFanCard()" />
          </section>

          <p class="identity-page__login-prompt">
            Already have a card? <span>Log in</span>
          </p>

          <div class="identity-page__actions">
            <button
              class="f-button f-button--primary identity-page__action-btn"
              data-ui="save-fan-card-btn"
              type="button"
              (click)="handleContinue()"
            >
              Save fan card
            </button>
            <button
              class="f-button f-button--secondary identity-page__action-btn"
              data-ui="retake-photo-btn"
              type="button"
              (click)="handleRetake()"
            >
              Retake photo
            </button>
          </div>
        </main>
      </app-screen>
    }
  `,
  styles: [
    `
      .identity-page {
        display: flex;
        flex-direction: column;
        width: 100%;
      }

      .identity-page--team {
        min-height: 100%;
        padding: var(--sp-6) var(--sp-4) var(--sp-4);
      }

      .identity-page--preview {
        max-width: calc(var(--sp-20) * 4 + var(--sp-2));
        text-align: center;
        padding: var(--sp-8) var(--sp-4);
      }

      .identity-page__header {
        margin-bottom: var(--sp-4);
      }

      .identity-page__title {
        margin: 0;
        font: var(--f-brand-type-title-3);
        color: var(--c-text-1);
        letter-spacing: var(--tracking-tight);
      }

      .identity-page__subtitle {
        margin: var(--sp-2) 0 0;
        font: var(--f-brand-type-subheading);
        color: var(--c-text-2);
      }

      .identity-page__search {
        margin-bottom: var(--sp-3);
      }

      .identity-page__search-input {
        min-height: var(--sp-12);
        background: var(--c-surface);
        border-color: var(--c-border);
        color: var(--c-text-1);
      }

      .identity-page__search-input::placeholder {
        color: var(--c-text-2);
      }

      .identity-page__search-input:focus {
        border-color: var(--f-brand-color-border-primary);
      }

      .identity-page__search-input:focus-visible {
        outline: var(--f-brand-border-size-focused) solid var(--f-brand-color-border-primary);
        outline-offset: var(--sp-1);
      }

      .identity-page__team-list {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--sp-2);
        padding-bottom: var(--sp-4);
      }

      .identity-page__team-row {
        width: 100%;
        min-height: var(--sp-12);
        border: var(--f-brand-border-size-default) solid var(--c-border);
        border-radius: var(--f-brand-radius-inner);
        background: var(--c-surface);
        color: var(--c-text-1);
        padding: var(--sp-2) var(--sp-4);
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        text-align: left;
        cursor: pointer;
        transition:
          background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default),
          border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default);
      }

      .identity-page__team-row:hover {
        background: var(--c-surface-raise);
        border-color: var(--c-border-raise);
      }

      .identity-page__team-row:active {
        background: var(--c-surface-press);
      }

      .identity-page__team-row:focus-visible {
        outline: var(--f-brand-border-size-focused) solid var(--f-brand-color-border-primary);
        outline-offset: var(--sp-1);
      }

      .identity-page__team-swatch {
        width: var(--sp-6);
        min-height: var(--sp-6);
        border-radius: var(--r-full);
        display: flex;
        align-items: center;
        justify-content: center;
        border: var(--f-brand-border-size-default) solid var(--c-border-raise);
        flex-shrink: 0;
        font-size: var(--text-md);
      }

      .identity-page__team-name {
        flex: 1;
        font: var(--f-brand-type-body);
        color: var(--c-text-1);
      }

      .identity-page__team-chevron {
        font: var(--f-brand-type-headline);
        color: var(--c-text-2);
      }

      .identity-page__card-wrap {
        margin-top: var(--sp-4);
      }

      .identity-page__login-prompt {
        margin: var(--sp-5) 0 0;
        font: var(--f-brand-type-subheading);
        color: var(--c-text-2);
      }

      .identity-page__login-prompt span {
        color: var(--c-text-1);
        font: var(--f-brand-type-subheading-medium);
      }

      .identity-page__actions {
        margin-top: var(--sp-4);
        display: flex;
        flex-direction: column;
        gap: var(--sp-2);
      }

      .identity-page__action-btn {
        width: 100%;
      }

      @media (prefers-reduced-motion: reduce) {
        .identity-page__team-row {
          transition-duration: 0.01ms !important;
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
  private readonly returnedTeamId = this.getIncomingState('teamId');
  private readonly returnedPhoto = this.getIncomingState('photoDataUrl');
  private readonly storedCard = this.store.state().fanCard;
  private readonly initialTeamId = this.returnedTeamId ?? this.storedCard.teamId;
  private readonly initialPhoto = this.returnedPhoto ?? this.storedCard.photoDataUrl;

  readonly screenStyle = { background: 'var(--c-bg)' };

  readonly step = signal<Step>(
    this.initialTeamId && this.initialPhoto ? 'preview' : 'team'
  );
  readonly query = signal('');
  readonly selectedTeamId = signal<string | null>(this.initialTeamId);
  readonly photoDataUrl = signal<string | null>(this.initialPhoto);
  readonly filteredTeams = computed(() => {
    const search = this.query().trim().toLowerCase();
    if (!search) {
      return WORLD_CUP_TEAMS;
    }

    return WORLD_CUP_TEAMS.filter(team => team.name.toLowerCase().includes(search));
  });

  readonly previewFanCard = computed<FanCard>(() => {
    const state = this.store.state().fanCard;
    return {
      ...state,
      teamId: this.selectedTeamId() ?? state.teamId,
      photoDataUrl: this.photoDataUrl() ?? state.photoDataUrl,
    };
  });

  handleTeamSelect(teamId: string): void {
    this.selectedTeamId.set(teamId);
    this.analytics.track('identity_team_selected', { teamId });
    this.step.set('preview');
    void this.router.navigate(['/picture'], { state: { teamId } });
  }

  handleContinue(): void {
    const teamId = this.selectedTeamId();
    if (!teamId) {
      return;
    }

    this.store.updateFanCard({
      teamId,
      photoDataUrl: this.photoDataUrl(),
    });
    this.analytics.track('identity_continue_tapped', { teamId });
    void this.router.navigateByUrl('/card');
  }

  handleRetake(): void {
    const teamId = this.selectedTeamId();
    if (!teamId) {
      this.step.set('team');
      return;
    }

    this.photoDataUrl.set(null);
    this.analytics.track('identity_retake_tapped', { teamId });
    void this.router.navigate(['/picture'], { state: { teamId } });
  }

  private getIncomingState(key: 'teamId' | 'photoDataUrl'): string | null {
    const state = window.history.state as Record<string, unknown> | null;
    const value = state?.[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
