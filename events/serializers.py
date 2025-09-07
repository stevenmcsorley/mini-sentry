from rest_framework import serializers
from .models import Event, Project, Group, Release, Artifact, AlertRule, AlertTarget, Session, ReleaseDeployment, Comment


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "slug", "created_at", "ingest_token"]


class EventSerializer(serializers.ModelSerializer):
    group = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = Event
        fields = [
            "id",
            "project",
            "group",
            "message",
            "level",
            "payload",
            "received_at",
            "release",
            "environment",
            "tags",
            "stack",
            "symbolicated",
        ]


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = [
            "id",
            "project",
            "title",
            "level",
            "count",
            "first_seen",
            "last_seen",
            "status",
            "resolved_at",
            "assignee",
            "is_bookmarked",
        ]


class ReleaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Release
        fields = ["id", "project", "version", "environment", "created_at", "date_released"]


class ArtifactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artifact
        fields = ["id", "release", "name", "content", "content_type", "file_name", "checksum", "created_at"]


class AlertRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertRule
        fields = [
            "id",
            "project",
            "name",
            "level",
            "threshold_count",
            "threshold_window_minutes",
            "notify_interval_minutes",
            "rearm_after_minutes",
            "last_triggered_at",
            "target_type",
            "target_value",
            "active",
        ]


class AlertTargetSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertTarget
        fields = [
            "id",
            "rule",
            "target_type",
            "target_value",
            "subject_template",
            "body_template",
        ]


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = [
            "id",
            "project",
            "release",
            "environment",
            "session_id",
            "user",
            "status",
            "duration_ms",
            "started_at",
            "updated_at",
        ]


class ReleaseDeploymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReleaseDeployment
        fields = [
            "id",
            "project",
            "release",
            "environment",
            "name",
            "url",
            "date_started",
            "date_finished",
        ]


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["id", "group", "author", "body", "created_at"]
