import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  inject,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { track } from '../../lib/analytics'
import { WORLD_CUP_TEAMS, type WorldCupTeam } from '../../data/teams'

@Component({
  selector: 'ffz-team-selection-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-selection.component.html',
  styleUrl: './team-selection.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSelectionComponent {
  private readonly router = inject(Router)

  @ViewChild('dropdownRoot', { static: true }) dropdownRoot!: ElementRef<HTMLDivElement>

  selectedId: string | null = null
  open = false
  readonly teams = WORLD_CUP_TEAMS

  ngOnInit(): void {
    track('team_selection_viewed')
  }

  get selectedTeam(): WorldCupTeam | null {
    if (!this.selectedId) {
      return null
    }
    return this.teams.find(team => team.id === this.selectedId) ?? null
  }

  @HostListener('document:mousedown', ['$event'])
  closeDropdownOnOutsideClick(event: MouseEvent): void {
    const target = event.target as Node | null
    if (!target) {
      return
    }
    if (!this.dropdownRoot.nativeElement.contains(target)) {
      this.open = false
    }
  }

  onBack(): void {
    track('team_selection_back_tapped')
    void this.router.navigateByUrl('/')
  }

  toggleDropdown(): void {
    this.open = !this.open
  }

  onTeamSelect(teamId: string): void {
    this.selectedId = teamId
    this.open = false
    track('team_selection_team_selected', { teamId })
  }

  onContinue(): void {
    if (!this.selectedId) {
      return
    }
    void this.router.navigate(['/picture'], { state: { teamId: this.selectedId } })
  }
}
