import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export interface RoutePlaceholderEntry {
  label: string;
  value: string;
}

@Component({
  selector: 'ffz-route-placeholder',
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <section class="placeholder glass page-in">
      <p class="kicker">Angular migration</p>
      <h1 class="title">{{ title }}</h1>
      <p class="body">{{ description }}</p>
      <div class="meta-row">
        <span class="meta-label">Path</span>
        <span class="meta-value">{{ path }}</span>
      </div>
      <div class="meta-row" *ngFor="let entry of entries">
        <span class="meta-label">{{ entry.label }}</span>
        <span class="meta-value">{{ entry.value }}</span>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100svh;
      }

      .placeholder {
        min-height: 100svh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: var(--sp-3);
        padding: var(--sp-6);
        color: var(--c-text-1);
      }

      .kicker {
        margin: 0;
        font: var(--f-brand-type-caption);
        letter-spacing: var(--tracking-wide);
        text-transform: uppercase;
        color: var(--c-text-2);
      }

      .title {
        margin: 0;
        font: var(--f-brand-type-title-2);
        color: var(--c-text-1);
      }

      .body {
        margin: 0;
        font: var(--f-brand-type-body);
        color: var(--c-text-2);
      }

      .meta-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--sp-2);
        padding: var(--sp-2) var(--sp-3);
        border: var(--f-brand-border-size-default) solid var(--c-border);
        border-radius: var(--r-sm);
        background: var(--c-surface);
      }

      .meta-label {
        font: var(--f-brand-type-caption);
        color: var(--c-text-2);
      }

      .meta-value {
        font: var(--f-brand-type-subheading);
        color: var(--c-text-1);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutePlaceholderComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';
  @Input({ required: true }) path = '';
  @Input() entries: ReadonlyArray<RoutePlaceholderEntry> = [];
}
