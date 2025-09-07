# Ruby (Sinatra) example

Minimal Sinatra app reporting errors to Mini Sentry.

## Run

```
cd examples/ruby-sinatra
ruby app.rb -p 5003
# visit http://localhost:5003/boom
```

Set env:
- `MS_BASE` (default `http://localhost:8000`)
- `MS_TOKEN` project ingest token

