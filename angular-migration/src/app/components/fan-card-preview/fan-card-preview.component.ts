import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getTeam } from '../../data/teams';

@Component({
  selector: 'app-fan-card-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fan-card-preview.component.html',
  styleUrl: './fan-card-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FanCardPreviewComponent {
  @Input() teamId: string | null = null;
  @Input() photoDataUrl: string | null = null;

  get team() {
    return this.teamId ? getTeam(this.teamId) : undefined;
  }

  get cardBackground(): string {
    const team = this.team;
    if (!team) {
      return 'linear-gradient(160deg, var(--c-card-gradient-1) 0%, var(--c-card-gradient-2) 50%, var(--c-card-gradient-3) 100%)';
    }
    return `linear-gradient(160deg, ${team.colors[0]} 0%, ${team.colors[1]} 100%)`;
  }
}
