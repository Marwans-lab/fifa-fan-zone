import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FanCardPreviewComponent } from '../../components/fan-card-preview/fan-card-preview.component';
import { WORLD_CUP_TEAMS } from '../../data/teams';
import { AppStoreService } from '../../services/app-store.service';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-identity',
  standalone: true,
  imports: [CommonModule, FanCardPreviewComponent],
  templateUrl: './identity.component.html',
  styleUrl: './identity.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdentityComponent {
  private readonly router = inject(Router);
  readonly store = inject(AppStoreService);
  private readonly analytics = inject(AnalyticsService);

  readonly query = signal('');
  readonly selectedTeamId = signal<string | null>(this.store.state().fanCard.teamId);
  readonly photoDataUrl = computed(() => this.store.state().fanCard.photoDataUrl);
  readonly confirmed = signal(false);

  readonly filteredTeams = computed(() => {
    const searchValue = this.query().trim().toLowerCase();
    if (!searchValue) {
      return WORLD_CUP_TEAMS;
    }
    return WORLD_CUP_TEAMS.filter((team) => team.name.toLowerCase().includes(searchValue));
  });

  readonly hasPreview = computed(
    () => Boolean(this.selectedTeamId()) && Boolean(this.photoDataUrl())
  );
  readonly selectedTeam = computed(
    () => WORLD_CUP_TEAMS.find((team) => team.id === this.selectedTeamId()) ?? null
  );

  constructor() {
    this.analytics.track('identity_viewed', {
      hasTeam: Boolean(this.selectedTeamId()),
      hasPhoto: Boolean(this.photoDataUrl()),
    });
  }

  onQueryChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.query.set(target.value);
  }

  onTeamSelect(teamId: string): void {
    this.selectedTeamId.set(teamId);
    this.analytics.track('identity_team_selected', { teamId });
    void this.router.navigate(['/picture'], { state: { teamId } });
  }

  onRetake(): void {
    const teamId = this.selectedTeamId();
    if (!teamId) {
      return;
    }
    this.store.updateFanCard({ photoDataUrl: null, teamId });
    this.analytics.track('identity_retake_tapped', { teamId });
    void this.router.navigate(['/picture'], { state: { teamId } });
  }

  onConfirm(): void {
    const teamId = this.selectedTeamId();
    if (!teamId) {
      return;
    }
    this.store.updateFanCard({
      teamId,
      photoDataUrl: this.photoDataUrl(),
      answers: this.store.state().fanCard.answers,
      completedAt: new Date().toISOString(),
    });
    this.analytics.track('identity_continue_tapped', { teamId });
    this.confirmed.set(true);
    void this.router.navigateByUrl('/card');
  }
}
