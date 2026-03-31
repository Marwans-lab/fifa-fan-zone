import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';

import './styles/tokens.css';
import './styles/global.css';

bootstrapApplication(AppComponent, {
  providers: [provideRouter(appRoutes)],
}).catch((error: unknown) => {
  console.error('Angular bootstrap failed:', error);
});
