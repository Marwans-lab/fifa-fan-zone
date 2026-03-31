import { AnalyticsService } from './analytics.service';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';
import { QAAppService } from './qaapp.service';

export const firebaseService = new FirebaseService();
export const qaAppService = new QAAppService();
export const authService = new AuthService(firebaseService, qaAppService);
export const analyticsService = new AnalyticsService(qaAppService);
