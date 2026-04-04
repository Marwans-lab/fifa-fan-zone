import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { WORLD_CUP_TEAMS } from '../data/teams';
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
            <path d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <div class="team-selection-page__progress-track" aria-hidden="true">
          <div class="team-selection-page__progress-fill"></div>
        </div>
      </header>

      <h1 class="team-selection-page__title" data-section="title">Select your team</h1>

      <section class="team-selection-page__dropdown-wrap" data-section="team-dropdown">
        <button
          class="team-selection-page__dropdown-trigger"
          [class.team-selection-page__dropdown-trigger--placeholder]="!selectedId()"
          type="button"
          data-ui="team-dropdown-btn"
          [attr.aria-expanded]="dropdownOpen()"
          aria-haspopup="listbox"
          (click)="toggleDropdown()"
        >
          <span class="team-selection-page__dropdown-selected">
            @if (selectedTeamFlagClass()) {
              <i class="{{selectedTeamFlagClass()}}" aria-hidden="true"></i>
            }
            {{ selectedTeamName() ?? 'Select a team' }}
          </span>
          <svg
            class="team-selection-page__dropdown-chevron"
            [class.team-selection-page__dropdown-chevron--open]="dropdownOpen()"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6"></path>
          </svg>
        </button>

        @if (dropdownOpen()) {
          <ul class="team-selection-page__list" role="listbox">
            @for (team of dropdownTeams; track team.id; let isLast = $last) {
              <li
                class="team-selection-page__option"
                role="option"
                [attr.aria-selected]="selectedId() === team.id"
                [class.team-selection-page__option--selected]="selectedId() === team.id"
                [class.team-selection-page__option--with-divider]="!isLast"
                (click)="selectTeam(team.id)"
              >
                <i class="{{team.flagClass}}" aria-hidden="true"></i>
                {{ team.name }}
              </li>
            }
          </ul>
        }
      </section>

      <div class="team-selection-page__spacer"></div>

      <p class="team-selection-page__login-prompt">
        Already have a card?
        <span class="team-selection-page__login-link">Log in</span>
      </p>

      <button
        class="team-selection-page__continue"
        type="button"
        data-section="confirm-cta"
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
        width: 100%;
        background: var(--f-brand-color-background-default);
        display: flex;
        flex-direction: column;
        padding: var(--f-brand-space-md);
        box-sizing: border-box;
        overflow: hidden;
      }

      .team-selection-page__header {
        display: flex;
        align-items: center;
        gap: var(--f-brand-space-md);
        flex-shrink: 0;
      }

      .team-selection-page__back {
        width: var(--sp-12);
        height: var(--sp-12);
        border: none;
        border-radius: var(--f-brand-radius-rounded);
        background: var(--f-brand-color-background-light);
        display: grid;
        place-items: center;
        cursor: pointer;
        flex-shrink: 0;
      }

      .team-selection-page__back svg {
        width: var(--sp-5);
        height: var(--sp-5);
        stroke: var(--f-brand-color-text-default);
        stroke-width: 2;
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
        border-radius: var(--f-brand-radius-rounded);
        background: linear-gradient(
          -90deg,
          var(--f-brand-color-border-success) 61.5%,
          var(--f-brand-color-background-success) 100%
        );
        box-shadow: 1px 0px 6px var(--f-brand-shadow-large);
        transition: width var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit);
      }

      .team-selection-page__title {
        margin: 0;
        margin-top: var(--f-brand-space-xl);
        margin-bottom: var(--f-brand-space-xl);
        text-align: center;
        color: var(--f-brand-color-text-default);
        font: var(--f-brand-type-title-3);
        flex-shrink: 0;
      }

      .team-selection-page__dropdown-wrap {
        position: relative;
        flex-shrink: 0;
      }

      .team-selection-page__dropdown-trigger {
        width: 100%;
        height: var(--sp-12);
        border: var(--f-brand-border-size-default) solid var(--f-brand-color-border-default);
        border-radius: var(--f-brand-radius-base);
        background: var(--f-brand-color-background-light);
        color: var(--f-brand-color-text-default);
        padding: 0 var(--f-brand-space-md);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font: var(--f-brand-type-body);
        cursor: pointer;
      }

      .team-selection-page__dropdown-trigger--placeholder {
        color: var(--f-brand-color-text-subtle);
      }

      .team-selection-page__dropdown-selected {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
      }

      .team-selection-page__dropdown-chevron {
        width: var(--sp-4);
        height: var(--sp-4);
        stroke: var(--f-brand-color-text-subtle);
        stroke-width: 2;
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
        transform: rotate(0deg);
        transition: transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit);
      }

      .team-selection-page__dropdown-chevron--open {
        transform: rotate(180deg);
      }

      .team-selection-page__list {
        position: absolute;
        top: calc(100% + var(--f-brand-space-xs));
        left: 0;
        right: 0;
        list-style: none;
        margin: 0;
        padding: 0 var(--f-brand-space-md);
        max-height: 560px;
        overflow-y: auto;
        scroll-behavior: smooth;
        scrollbar-width: thin;
        scrollbar-color: var(--f-brand-color-text-muted) transparent;
        border: none;
        border-radius: var(--f-brand-radius-base);
        background: var(--f-brand-color-background-light);
        box-shadow: 0px 2px 4px 2px var(--f-brand-shadow-medium);
        z-index: 10;
      }

      .team-selection-page__option {
        width: 100%;
        border: none;
        background: transparent;
        color: var(--f-brand-color-text-default);
        padding: var(--f-brand-space-md) 0;
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        font: var(--f-brand-type-body);
        text-align: left;
        cursor: pointer;
        transition: background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit),
                    color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit);
        border-radius: var(--f-brand-radius-base);
        margin: 0 calc(var(--f-brand-space-md) * -1);
        padding-left: var(--f-brand-space-md);
        padding-right: var(--f-brand-space-md);
      }

      .team-selection-page__option:hover {
        background: var(--f-brand-color-background-default);
      }

      .team-selection-page__option--selected {
        background: var(--c-lt-brand);
        color: var(--f-brand-color-text-inverse);
        border-radius: var(--f-brand-radius-base);
      }

      .team-selection-page__option--selected:hover {
        background: var(--c-lt-brand);
      }

      .team-selection-page__option--with-divider {
        border-bottom: var(--f-brand-border-size-default) solid var(--f-brand-color-background-default);
      }

      .team-selection-page__spacer {
        flex: 1;
      }

      .team-selection-page__login-prompt {
        margin: 0;
        margin-bottom: var(--f-brand-space-md);
        text-align: center;
        color: var(--f-brand-color-text-default);
        font: var(--f-brand-type-headline);
        flex-shrink: 0;
      }

      .team-selection-page__login-link {
        font-weight: var(--weight-med);
      }

      .team-selection-page__continue {
        width: 100%;
        height: var(--sp-14);
        border: none;
        border-radius: var(--f-brand-radius-rounded);
        background: var(--f-brand-color-primary);
        color: var(--f-brand-color-background-light);
        font: var(--f-brand-type-body-medium);
        cursor: pointer;
        opacity: 1;
        transition: opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit);
        flex-shrink: 0;
      }

      .team-selection-page__continue:disabled {
        opacity: var(--f-brand-opacity-disabled);
        cursor: default;
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

  readonly dropdownTeams = WORLD_CUP_TEAMS;

  readonly dropdownOpen = signal(true);
  readonly selectedId = signal<string | null>(this.store.state().fanCard.teamId);

  selectedTeamName(): string | null {
    const selectedId = this.selectedId();
    if (!selectedId) return null;
    return this.dropdownTeams.find(team => team.id === selectedId)?.name ?? null;
  }

  selectedTeamFlagClass(): string | null {
    const selectedId = this.selectedId();
    if (!selectedId) return null;
    return this.dropdownTeams.find(team => team.id === selectedId)?.flagClass ?? null;
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
