import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy,
    },
  ],
};
