import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { WORLD_CUP_TEAMS } from '../../data/teams';
import { AnalyticsService } from '../services/analytics.service';
import { StoreService } from '../services/store.service';

@Component({
  standalone: true,
  template: `
    <main class="team-selection-page f-page-enter" data-page="team-selection">
      <header class="team-selection-page__header" data-section="header">
        <button
          class="team-selection-page__back"
          data-ui="back-btn"
          type="button"
          aria-label="Go back"
          (click)="handleBack()"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 19L8 12L15 5"></path>
          </svg>
        </button>
        <div class="team-selection-page__progress-track" aria-hidden="true">
          <div class="team-selection-page__progress-fill"></div>
        </div>
      </header>

      <h1 class="team-selection-page__title">Select your team</h1>

      <section class="team-selection-page__dropdown-wrap">
        <button
          class="team-selection-page__dropdown-trigger"
          type="button"
          data-ui="team-dropdown-btn"
          [attr.aria-expanded]="dropdownOpen()"
          aria-haspopup="listbox"
          (click)="toggleDropdown()"
        >
          <span>{{ selectedTeamName() ?? 'Select a team' }}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9L12 15L18 9"></path>
          </svg>
        </button>

        @if (dropdownOpen()) {
          <ul class="team-selection-page__list" role="listbox">
            @for (team of dropdownTeams; track team.id) {
              <li>
                <button
                  class="team-selection-page__option"
                  type="button"
                  role="option"
                  [attr.aria-selected]="selectedId() === team.id"
                  (click)="selectTeam(team.id)"
                >
                  <span aria-hidden="true">{{ team.flag }}</span>
                  {{ team.name }}
                </button>
              </li>
            }
          </ul>
        }
      </section>

      <div class="team-selection-page__spacer"></div>

      <button
        class="team-selection-page__continue"
        type="button"
        data-ui="continue-btn"
        [disabled]="!selectedId()"
        (click)="handleContinue()"
      >
        Add your photo
      </button>
    </main>
  `,
  styles: [
    `
      .team-selection-page {
        min-height: 100dvh;
        background: var(--c-lt-bg);
        display: flex;
        flex-direction: column;
        gap: var(--sp-6);
        padding: var(--sp-4);
      }

      .team-selection-page__header {
        display: flex;
        align-items: center;
        gap: var(--sp-4);
        margin-top: var(--sp-2);
      }

      .team-selection-page__back {
        width: var(--sp-12);
        min-height: var(--sp-12);
        border: var(--f-brand-border-size-default) solid var(--f-brand-color-border-default);
        border-radius: var(--f-brand-radius-rounded);
        background: var(--f-brand-color-background-light);
        display: grid;
        place-items: center;
        cursor: pointer;
      }

      .team-selection-page__back svg {
        width: var(--sp-5);
        height: var(--sp-5);
        stroke: var(--f-brand-color-text-default);
        stroke-width: var(--f-brand-border-size-focused);
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .team-selection-page__progress-track {
        flex: 1;
        height: var(--sp-2);
        background: var(--f-brand-color-border-default);
        border-radius: var(--f-brand-radius-rounded);
        overflow: hidden;
      }

      .team-selection-page__progress-fill {
        width: 50%;
        height: 100%;
        background: var(--f-brand-color-background-primary);
      }

      .team-selection-page__title {
        margin: 0;
        text-align: center;
        color: var(--c-lt-text-1);
        font: var(--f-brand-type-title-2);
      }

      .team-selection-page__dropdown-wrap {
        position: relative;
      }

      .team-selection-page__dropdown-trigger {
        width: 100%;
        min-height: var(--sp-12);
        border: var(--f-brand-border-size-default) solid var(--f-brand-color-border-default);
        border-radius: var(--f-brand-radius-base);
        background: var(--f-brand-color-background-light);
        color: var(--f-brand-color-text-default);
        padding: var(--sp-3) var(--sp-4);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font: var(--f-brand-type-body);
        cursor: pointer;
      }

      .team-selection-page__dropdown-trigger svg {
        width: var(--sp-4);
        height: var(--sp-4);
        stroke: var(--f-brand-color-text-subtle);
        stroke-width: var(--f-brand-border-size-focused);
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .team-selection-page__list {
        position: absolute;
        top: calc(100% + var(--sp-1));
        left: 0;
        right: 0;
        list-style: none;
        margin: 0;
        padding: var(--sp-2);
        max-height: calc(var(--sp-20) * 3);
        overflow-y: auto;
        border: var(--f-brand-border-size-default) solid var(--f-brand-color-border-default);
        border-radius: var(--f-brand-radius-base);
        background: var(--f-brand-color-background-light);
        box-shadow: var(--f-brand-shadow-medium);
        z-index: 1;
      }

      .team-selection-page__option {
        width: 100%;
        min-height: var(--sp-12);
        border: none;
        border-radius: var(--f-brand-radius-base);
        background: transparent;
        color: var(--f-brand-color-text-default);
        padding: var(--sp-2) var(--sp-3);
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        font: var(--f-brand-type-body);
        text-align: left;
        cursor: pointer;
      }

      .team-selection-page__option[aria-selected='true'] {
        background: var(--c-brand-tint-12);
      }

      .team-selection-page__spacer {
        flex: 1;
      }

      .team-selection-page__continue {
        width: 100%;
        min-height: var(--sp-14);
        border: none;
        border-radius: var(--f-brand-radius-rounded);
        background: var(--f-brand-color-background-primary);
        color: var(--f-brand-color-text-light);
        font: var(--f-brand-type-body-medium);
        cursor: pointer;
      }

      .team-selection-page__continue:disabled {
        background: var(--f-brand-color-background-disabled);
        color: var(--f-brand-color-text-disabled);
        cursor: not-allowed;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSelectionPage {
  private readonly router = inject(Router);
  private readonly store = inject(StoreService);
  private readonly analytics = inject(AnalyticsService);
  private readonly hostElement = inject(ElementRef<HTMLElement>);

  readonly dropdownTeams = WORLD_CUP_TEAMS.slice(0, 48);

  readonly dropdownOpen = signal(false);
  readonly selectedId = signal<string | null>(this.store.state().fanCard.teamId);

  selectedTeamName(): string | null {
    const selectedId = this.selectedId();
    if (!selectedId) return null;
    return this.dropdownTeams.find(team => team.id === selectedId)?.name ?? null;
  }

  toggleDropdown(): void {
    this.dropdownOpen.update(isOpen => !isOpen);
  }

  selectTeam(teamId: string): void {
    this.selectedId.set(teamId);
    this.dropdownOpen.set(false);
    this.store.updateFanCard({ teamId });
    this.analytics.track('team_selection_team_selected', { teamId });
  }

  handleBack(): void {
    this.analytics.track('team_selection_back_tapped');
    void this.router.navigateByUrl('/');
  }

  handleContinue(): void {
    const teamId = this.selectedId();
    if (!teamId) return;
    this.analytics.track('team_selection_continue_tapped', { teamId });
    void this.router.navigate(['/picture', teamId], { state: { teamId } });
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const clickedInside = this.hostElement.nativeElement.contains(event.target as Node);
    if (!clickedInside) {
      this.dropdownOpen.set(false);
    }
  }
}
