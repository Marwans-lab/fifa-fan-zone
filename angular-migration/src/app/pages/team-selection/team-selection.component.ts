import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WORLD_CUP_TEAMS, type WorldCupTeam } from '../../data/teams';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-team-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-selection.component.html',
  styleUrl: './team-selection.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSelectionComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);

  @ViewChild('dropdownRoot', { static: true })
  dropdownRoot!: ElementRef<HTMLDivElement>;

  selectedId: string | null = null;
  open = false;

  readonly teams: WorldCupTeam[] = WORLD_CUP_TEAMS;

  get selectedTeam(): WorldCupTeam | null {
    if (!this.selectedId) {
      return null;
    }
    return this.teams.find((team) => team.id === this.selectedId) ?? null;
  }

  ngOnInit(): void {
    this.analytics.track('team_selection_viewed');
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }
    if (!this.dropdownRoot.nativeElement.contains(target)) {
      this.open = false;
    }
  }

  onBack(): void {
    this.analytics.track('team_selection_back_tapped');
    void this.router.navigateByUrl('/');
  }

  toggleDropdown(): void {
    this.open = !this.open;
  }

  onTeamSelect(id: string): void {
    this.selectedId = id;
    this.open = false;
    this.analytics.track('team_selection_team_selected', { teamId: id });
  }

  onContinue(): void {
    if (!this.selectedId) {
      return;
    }
    this.analytics.track('team_selection_continue_tapped', { teamId: this.selectedId });
    void this.router.navigate(['/picture'], { state: { teamId: this.selectedId } });
  }
}
