import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { WORLD_CUP_TEAMS } from '../../data/teams'
import { StoreService } from '../../store/store.service'
import { track } from '../../lib/analytics'

@Component({
  selector: 'ffz-identity-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './identity.component.html',
  styleUrl: './identity.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdentityComponent {
  private readonly router = inject(Router)
  private readonly store = inject(StoreService)

  readonly query = signal('')
  readonly selectedTeamId = signal<string | null>(this.store.state().fanCard.teamId)

  readonly photoDataUrl = computed(() => this.store.state().fanCard.photoDataUrl)
  readonly hasPreview = computed(
    () => Boolean(this.selectedTeamId()) && Boolean(this.photoDataUrl()),
  )

  readonly filteredTeams = computed(() => {
    const search = this.query().trim().toLowerCase()
    if (!search) {
      return WORLD_CUP_TEAMS
    }
    return WORLD_CUP_TEAMS.filter(team => team.name.toLowerCase().includes(search))
  })

  constructor() {
    track('identity_viewed', {
      hasTeam: Boolean(this.selectedTeamId()),
      hasPhoto: Boolean(this.photoDataUrl()),
    })
  }

  onQueryChange(event: Event): void {
    const target = event.target as HTMLInputElement
    this.query.set(target.value)
  }

  onTeamSelect(teamId: string): void {
    this.selectedTeamId.set(teamId)
    track('identity_team_selected', { teamId })
    void this.router.navigate(['/picture'], { state: { teamId } })
  }

  onRetake(): void {
    const teamId = this.selectedTeamId()
    if (!teamId) {
      return
    }
    this.store.updateFanCard({ teamId, photoDataUrl: null })
    track('identity_retake_tapped', { teamId })
    void this.router.navigate(['/picture'], { state: { teamId } })
  }

  onConfirm(): void {
    const teamId = this.selectedTeamId()
    if (!teamId) {
      return
    }
    this.store.updateFanCard({ teamId, photoDataUrl: this.photoDataUrl() })
    track('identity_continue_tapped', { teamId })
    void this.router.navigateByUrl('/card')
  }
}
