# AWS Lambda (Node.js) example

Report errors from a Lambda handler to Mini Sentry.

## handler.js

```
export const handler = async (event) => {
  const BASE = process.env.MS_BASE || 'http://localhost:8000'
  const TOKEN = process.env.MS_TOKEN
  try {
    throw new Error('Deliberate error from Lambda')
  } catch (err) {
    try {
      await fetch(`${BASE}/api/events/ingest/token/${TOKEN}/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: err.message, level: 'error', stack: err.stack, release: '1.0.0', environment: process.env.STAGE || 'dev', app: 'lambda-example' })
      })
    } catch (e) {}
    return { statusCode: 500, body: 'reported' }
  }
}
```

## serverless.yml (snippet)

```
service: mini-sentry-lambda
provider:
  name: aws
  runtime: nodejs18.x
  environment:
    MS_BASE: https://your-api
    MS_TOKEN: ${env:MS_TOKEN}
functions:
  boom:
    handler: handler.handler
    events:
      - httpApi: GET /boom
```

Set `MS_TOKEN` in your deployment environment.

