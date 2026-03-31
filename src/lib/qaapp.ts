import {
  qaAppService,
} from '../app/services/service-instances';
import { type QAAppBridge, type QAAppSharePayload } from '../app/services/qaapp.service';

export type QAAppInterface = QAAppBridge;
export type { QAAppSharePayload };

export function initQAApp(): void {
  qaAppService.initBridge();
}
