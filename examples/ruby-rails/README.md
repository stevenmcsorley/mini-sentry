# Ruby on Rails example

Integrate Mini Sentry via a Rack middleware to auto‑report unhandled errors.

## Add middleware

Copy `examples/ruby-rails/ms_middleware.rb` into your app (e.g., `lib/ms_middleware.rb`), then load it:

```rb
# config/application.rb
require_relative '../lib/ms_middleware'
module YourApp
  class Application < Rails::Application
    config.middleware.insert_after ActionDispatch::ShowExceptions, MiniSentryRack
  end
end
```

Env:
- `MS_BASE` (default `http://localhost:8000`)
- `MS_TOKEN` (project ingest token)
- Optional: `MS_RELEASE`, `RAILS_ENV`

The middleware posts `{ message, level, stack, release, environment }` on exceptions.

