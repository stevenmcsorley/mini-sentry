# Laravel integration

Report exceptions to Mini Sentry via the global exception handler.

## app/Exceptions/Handler.php

```
public function register(): void
{
    $this->reportable(function (Throwable $e) {
        try {
            $base = env('MS_BASE', 'http://localhost:8000');
            $token = env('MS_TOKEN');
            if (!$token) { return; }
            $payload = [
                'message' => $e->getMessage(),
                'level' => 'error',
                'stack' => (string)$e,
                'release' => env('MS_RELEASE', '1.0.0'),
                'environment' => app()->environment(),
                'app' => 'laravel-app',
            ];
            \Illuminate\Support\Facades\Http::timeout(3)->withHeaders(['Content-Type'=>'application/json'])
                ->post("{$base}/api/events/ingest/token/{$token}/", $payload);
        } catch (\Throwable $t) {}
    });
}
```

Set env `MS_TOKEN` (and optionally `MS_BASE`).

