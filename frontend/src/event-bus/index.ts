import { EventBus } from './event-bus';
import type { FrontendEventMap } from './events';

export type { FrontendEventMap } from './events';
export { EventBus } from './event-bus';

export const appEventBus = new EventBus<FrontendEventMap>('frontend', 500);
