import { setupWorker } from 'msw/browser';

import { handlers } from '@/tests/msw/handlers';

export const worker = setupWorker(...handlers);
