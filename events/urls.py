from rest_framework.routers import DefaultRouter
from django.urls import path, include
from django.http import JsonResponse

from .views import ProjectViewSet, EventViewSet, GroupViewSet, ReleaseViewSet, SymbolicateView, AlertRuleViewSet, SessionIngestView, ReleaseHealthView, ReleaseHealthSeriesView, DeploymentViewSet

router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"events", EventViewSet, basename="event")
router.register(r"groups", GroupViewSet, basename="group")
router.register(r"releases", ReleaseViewSet, basename="release")
router.register(r"alert-rules", AlertRuleViewSet, basename="alertrule")
router.register(r"deployments", DeploymentViewSet, basename="deployment")

urlpatterns = [
    path("", include(router.urls)),
    path("health/", lambda r: JsonResponse({"ok": True})),
    path("symbolicate/", SymbolicateView.as_view()),
    path("sessions/ingest/token/<str:token>/", SessionIngestView.as_view()),
    path("releases/health/", ReleaseHealthView.as_view()),
    path("releases/health/series/", ReleaseHealthSeriesView.as_view()),
]
