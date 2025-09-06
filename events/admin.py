from django.contrib import admin
from .models import Project, Event, Group, Release, Artifact, AlertRule, AlertTarget, AlertState, ReleaseDeployment, Session


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "created_at")
    search_fields = ("name", "slug")


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "group", "level", "received_at")
    list_filter = ("level", "project", "group")
    search_fields = ("message",)


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "title", "level", "count", "last_seen")
    list_filter = ("level", "project")
    search_fields = ("title", "fingerprint")


@admin.register(Release)
class ReleaseAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "version", "environment", "created_at")
    list_filter = ("project", "environment")
    search_fields = ("version",)


@admin.register(Artifact)
class ArtifactAdmin(admin.ModelAdmin):
    list_display = ("id", "release", "name", "content_type", "created_at")
    search_fields = ("name",)


@admin.register(AlertRule)
class AlertRuleAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "name", "level", "threshold_count", "target_type", "active")
    list_filter = ("project", "level", "target_type", "active")
    search_fields = ("name",)


@admin.register(AlertState)
class AlertStateAdmin(admin.ModelAdmin):
    list_display = ("id", "rule", "group", "last_triggered_at")
    list_filter = ("rule",)


@admin.register(AlertTarget)
class AlertTargetAdmin(admin.ModelAdmin):
    list_display = ("id", "rule", "target_type", "target_value")
    list_filter = ("target_type",)


@admin.register(ReleaseDeployment)
class ReleaseDeploymentAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "release", "environment", "name", "date_started", "date_finished")
    list_filter = ("project", "environment")


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "session_id", "status", "environment", "updated_at")
    list_filter = ("project", "status", "environment")
    search_fields = ("session_id", "user")
