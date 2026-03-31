import { Component, inject } from '@angular/core'
import { Router } from '@angular/router'
import type { PictureRouteState } from '../../types/navigation-state'

@Component({
  selector: 'app-picture-page',
  standalone: true,
  template: `
    <main class="page-in" data-route="picture" style="min-height: 100dvh; padding: var(--sp-6);">
      <h1 style="font: var(--f-brand-type-title-3); color: var(--c-text-1);">Picture</h1>
      <p style="font: var(--f-brand-type-body); color: var(--c-text-2);">Placeholder page for Angular migration.</p>
      <p style="font: var(--f-brand-type-caption); color: var(--c-text-2);">teamId: {{ teamId ?? "not provided" }}</p>
    </main>
  `,
})
export class PicturePage {
  private readonly router = inject(Router)
  private readonly state = (this.router.getCurrentNavigation()?.extras.state ?? history.state ?? {}) as PictureRouteState
  readonly teamId = typeof this.state.teamId === 'string' ? this.state.teamId : null
}
