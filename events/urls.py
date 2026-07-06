from rest_framework.routers import DefaultRouter
from django.urls import path, include
from django.http import JsonResponse

from rest_framework_simplejwt.views import TokenRefreshView

from .views import ProjectViewSet, EventViewSet, GroupViewSet, ReleaseViewSet, SymbolicateView, AlertRuleViewSet, SessionIngestView, ReleaseHealthView, ReleaseHealthSeriesView, DeploymentViewSet, EventSeriesView, TopGroupsView
from .auth_views import RegisterView, LoginView, MeView, AuthConfigView
from .workspace_views import (
    WorkspacesView, CurrentWorkspaceView, MembersView, MemberDetailView,
    InvitesView, InviteDetailView, InviteInspectView, InviteAcceptView,
)
from .token_views import ApiTokensView, ApiTokenDetailView
from .integration_views import (
    IntegrationsView, IntegrationDetailView, GroupCreateIssueView, GroupLinksView,
)
from .project_views import ProjectOverviewView, ProjectTrackingView, ProjectTrackingDetailView, EstateView

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
    path("auth/register/", RegisterView.as_view()),
    path("auth/login/", LoginView.as_view()),
    path("auth/me/", MeView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("auth/config/", AuthConfigView.as_view()),
    path("workspaces/", WorkspacesView.as_view()),
    path("workspaces/current/", CurrentWorkspaceView.as_view()),
    path("workspaces/current/members/", MembersView.as_view()),
    path("workspaces/current/members/<int:member_id>/", MemberDetailView.as_view()),
    path("workspaces/current/invites/", InvitesView.as_view()),
    path("workspaces/current/invites/<int:invite_id>/", InviteDetailView.as_view()),
    path("invites/<str:token>/", InviteInspectView.as_view()),
    path("invites/<str:token>/accept/", InviteAcceptView.as_view()),
    path("tokens/", ApiTokensView.as_view()),
    path("tokens/<int:token_id>/", ApiTokenDetailView.as_view()),
    path("estate/", EstateView.as_view()),
    path("projects/<slug:slug>/overview/", ProjectOverviewView.as_view()),
    path("projects/<slug:slug>/tracking/", ProjectTrackingView.as_view()),
    path("projects/<slug:slug>/tracking/<int:item_id>/", ProjectTrackingDetailView.as_view()),
    path("integrations/", IntegrationsView.as_view()),
    path("integrations/<str:provider>/", IntegrationDetailView.as_view()),
    path("groups/<int:group_id>/create-issue/", GroupCreateIssueView.as_view()),
    path("groups/<int:group_id>/links/", GroupLinksView.as_view()),
    path("symbolicate/", SymbolicateView.as_view()),
    path("sessions/ingest/token/<str:token>/", SessionIngestView.as_view()),
    path("releases/health/", ReleaseHealthView.as_view()),
    path("releases/health/series/", ReleaseHealthSeriesView.as_view()),
    path("dashboard/series/", EventSeriesView.as_view()),
    path("dashboard/top-groups/", TopGroupsView.as_view()),
]
