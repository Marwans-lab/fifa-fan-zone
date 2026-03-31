import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppStoreService } from '../../services/app-store.service';
import { AnalyticsService } from '../../services/analytics.service';
import { WORLD_CUP_TEAMS, type WorldCupTeam } from '../../data/teams';

interface CardConfig {
  width: number;
  height: number;
  rotateDeg: number;
  zIndex: number;
  team: WorldCupTeam;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly store = inject(AppStoreService);
  private readonly analytics = inject(AnalyticsService);

  private authFetched = false;

  readonly cards: CardConfig[] = [
    {
      width: 272,
      height: 388,
      rotateDeg: 5,
      zIndex: 1,
      team: WORLD_CUP_TEAMS.find((team) => team.id === 'bra')!,
    },
    {
      width: 301,
      height: 430,
      rotateDeg: -3,
      zIndex: 2,
      team: WORLD_CUP_TEAMS.find((team) => team.id === 'arg')!,
    },
  ];

  get hasCard(): boolean {
    return Boolean(this.store.state().fanCard.teamId);
  }

  get ctaLabel(): string {
    return this.hasCard ? 'View your fan card' : 'Create your fan card';
  }

  ngOnInit(): void {
    this.analytics.track('landing_viewed', { hasCard: this.hasCard });
    if (!this.authFetched) {
      this.authFetched = true;
      void window.QAApp?.getAuthToken().catch(() => undefined);
    }
  }

  onPrimaryTap(): void {
    this.analytics.track('landing_primary_cta_tapped', { hasCard: this.hasCard });
    void this.router.navigateByUrl(this.hasCard ? '/identity' : '/team-selection');
  }
}
