# ASP.NET Core (minimal API) example

Minimal .NET app reporting errors to Mini Sentry using a global error handler.

## Run

```
cd examples/dotnet-aspnetcore
# Create a project if needed: dotnet new web -n MiniSentryDemo && replace Program.cs with this example
MS_BASE=http://localhost:8000 MS_TOKEN=PASTE_INGEST_TOKEN dotnet run
# visit http://localhost:5000/boom (or printed port)
```

`Program.cs` posts `{ message, level, stack, release, environment }` on unhandled errors.

