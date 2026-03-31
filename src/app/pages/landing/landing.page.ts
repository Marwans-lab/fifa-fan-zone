import { Component } from '@angular/core'

@Component({
  selector: 'app-landing-page',
  standalone: true,
  template: `
    <main class="page-in" data-route="landing" style="min-height: 100dvh; padding: var(--sp-6);">
      <h1 style="font: var(--f-brand-type-title-3); color: var(--c-text-1);">Landing</h1>
      <p style="font: var(--f-brand-type-body); color: var(--c-text-2);">Placeholder page for Angular migration.</p>
    </main>
  `,
})
export class LandingPage {}
