# Vue (Vite) example

Integrate the plain JS client to capture browser errors and send custom events.

## Setup

- Copy `examples/js-client/miniSentry.js` into `src/lib/miniSentry.js`.
- Initialize once in `main.js`.

```
// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import { initMiniSentry } from './lib/miniSentry.js'

const ms = initMiniSentry({ token: import.meta.env.VITE_MS_TOKEN, baseUrl: import.meta.env.VITE_MS_BASE || 'http://localhost:8000', release: '1.0.0', environment: import.meta.env.MODE })

createApp(App).mount('#app')
```

Send manual events in any component:

```
import { ms } from './lib/miniSentry'
ms.captureMessage('hello from Vue', { level: 'info' })
```

Use a Vite dev proxy for `/api` or set `VITE_MS_BASE` and enable CORS on the backend.

