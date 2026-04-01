import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { buildRouteContext } from './page-context.util';

@Component({
  standalone: true,
  template: `
    <main class="angular-page">
      <h1 class="angular-page__title">Swipe quiz</h1>
      <p class="angular-page__description">Angular migration placeholder for the swipe quiz route.</p>
      <p class="angular-page__context">{{ context }}</p>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwipeQuizPage {
  readonly context: string;

  constructor(route: ActivatedRoute) {
    this.context = buildRouteContext(route.snapshot.paramMap);
  }
}
