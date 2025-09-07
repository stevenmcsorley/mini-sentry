# Angular example

Use the plain JS client to report errors.

## Setup

- Copy `examples/js-client/miniSentry.js` to `src/app/miniSentry.js`.
- Initialize once in `main.ts` (or `app.module.ts`).

```
// src/main.ts
import { initMiniSentry } from './app/miniSentry.js';
const ms = initMiniSentry({ token: (window as any).MS_TOKEN || 'PASTE', baseUrl: 'http://localhost:8000', release: '1.0.0', environment: 'development' });
```

Send custom events from services/components:

```
import { ms } from './app/miniSentry';
ms.captureMessage('clicked save', { level: 'info' });
```

For dev, add a proxy to route `/api` → `http://localhost:8000` (Angular dev proxy config), or enable CORS and set `baseUrl`.

