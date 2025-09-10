from django.contrib import admin
from django.urls import path, include
from .views import swagger_ui, openapi_yaml
from events.ui_views import projects_page, project_events_page
urlpatterns = [
    path("admin/", admin.site.urls),
    # SSE endpoint removed - replaced with WebSocket
    path("api/", include("events.urls")),
    path("docs/", swagger_ui, name="swagger_ui"),
    path("docs/openapi.yaml", openapi_yaml, name="openapi_yaml"),
    path("", projects_page, name="projects_page"),
    path("projects/<slug:slug>/", project_events_page, name="project_events_page"),
]
