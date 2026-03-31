import { Component } from '@angular/core'

@Component({
  selector: 'ffz-home',
  standalone: true,
  template: `
    <section class="page-in" style="padding: var(--sp-6); display: grid; gap: var(--sp-4);">
      <h1
        style="
          font-family: var(--font-display);
          font-size: var(--text-3xl);
          font-weight: var(--weight-light);
          color: var(--c-lt-text-1);
          letter-spacing: var(--tracking-tight);
          line-height: var(--leading-tight);
        "
      >
        FIFA FanZone
      </h1>
      <p
        style="
          font-family: var(--font-body);
          font-size: var(--text-md);
          font-weight: var(--weight-reg);
          line-height: var(--leading-body);
          color: var(--c-lt-text-2);
          max-width: 42ch;
        "
      >
        Angular migration scaffold is ready. React routes remain in the repository for incremental migration.
      </p>
      <div class="glass" style="padding: var(--sp-4); border-radius: var(--r-lg);">
        <p
          style="
            font-family: var(--font-body);
            font-size: var(--text-sm);
            font-weight: var(--weight-med);
            color: var(--c-lt-text-1);
            letter-spacing: var(--tracking-wide);
          "
        >
          Build target: <code style="font-family: var(--font-body);">/fifa-fan-zone/</code>
        </p>
      </div>
    </section>
  `,
})
export class HomeComponent {}
