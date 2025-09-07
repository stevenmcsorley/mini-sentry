using System.Net.Http.Json;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var BASE = Environment.GetEnvironmentVariable("MS_BASE") ?? "http://localhost:8000";
var TOKEN = Environment.GetEnvironmentVariable("MS_TOKEN") ?? "PASTE_INGEST_TOKEN";

async Task SendEvent(string message, string level = "error", string? stack = null)
{
    try
    {
        using var client = new HttpClient();
        var url = $"{BASE}/api/events/ingest/token/{TOKEN}/";
        var body = new
        {
            message,
            level,
            stack,
            release = "1.0.0",
            environment = "Development",
            app = "aspnetcore-example"
        };
        await client.PostAsJsonAsync(url, body);
    }
    catch { }
}

// Global exception handler
app.Use(async (context, next) =>
{
    try { await next(); }
    catch (Exception ex)
    {
        await SendEvent(ex.Message, "error", ex.ToString());
        context.Response.StatusCode = 500;
        await context.Response.WriteAsync("Server error");
    }
});

app.MapGet("/", () => "OK");
app.MapGet("/boom", () => { throw new Exception("Deliberate error from ASP.NET Core"); });

app.Run();

