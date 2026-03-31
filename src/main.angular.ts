import 'zone.js';
import { APP_BASE_HREF } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

import './styles/tokens.css';
import './styles/global.css';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [...(appConfig.providers ?? []), { provide: APP_BASE_HREF, useValue: '/fifa-fan-zone/' }],
}).catch((error: unknown) => {
  console.error('Angular bootstrap failed:', error);
});
