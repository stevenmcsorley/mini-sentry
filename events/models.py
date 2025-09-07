import secrets
from django.db import models
from django.utils import timezone


class Project(models.Model):
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(default=timezone.now)
    ingest_token = models.CharField(max_length=64, unique=True, blank=True)

    def __str__(self) -> str:  # pragma: no cover
        return self.slug

    def save(self, *args, **kwargs):
        if not self.ingest_token:
            # 43 chars from token_urlsafe(32); cap to 48 for readability
            self.ingest_token = secrets.token_urlsafe(32)[:48]
        return super().save(*args, **kwargs)


class Event(models.Model):
    LEVEL_CHOICES = (
        ("error", "error"),
        ("warning", "warning"),
        ("info", "info"),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="events")
    message = models.TextField()
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default="error")
    payload = models.JSONField(default=dict, blank=True)
    received_at = models.DateTimeField(default=timezone.now)
    group = models.ForeignKey(
        "Group", related_name="events", on_delete=models.SET_NULL, null=True, blank=True
    )
    release = models.ForeignKey("Release", null=True, blank=True, on_delete=models.SET_NULL, related_name="events")
    environment = models.CharField(max_length=64, default="production")
    tags = models.JSONField(default=list, blank=True)
    stack = models.TextField(null=True, blank=True)
    symbolicated = models.JSONField(default=dict, blank=True)

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.project.slug}: {self.level} - {self.message[:30]}"


class Group(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="groups")
    fingerprint = models.CharField(max_length=512, db_index=True)
    title = models.CharField(max_length=255)
    level = models.CharField(max_length=20, default="error")
    count = models.PositiveIntegerField(default=0)
    first_seen = models.DateTimeField(default=timezone.now)
    last_seen = models.DateTimeField(default=timezone.now)
    STATUS_UNRESOLVED = "unresolved"
    STATUS_RESOLVED = "resolved"
    STATUS_IGNORED = "ignored"
    STATUS_CHOICES = (
        (STATUS_UNRESOLVED, "unresolved"),
        (STATUS_RESOLVED, "resolved"),
        (STATUS_IGNORED, "ignored"),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_UNRESOLVED, db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    assignee = models.CharField(max_length=200, blank=True, default="")
    is_bookmarked = models.BooleanField(default=False)

    class Meta:
        unique_together = ("project", "fingerprint")

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.project.slug}:{self.title}"


class Release(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="releases")
    version = models.CharField(max_length=200)
    environment = models.CharField(max_length=64, default="production")
    created_at = models.DateTimeField(default=timezone.now)
    date_released = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("project", "version", "environment")

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.project.slug}@{self.version} ({self.environment})"


class Artifact(models.Model):
    release = models.ForeignKey(Release, on_delete=models.CASCADE, related_name="artifacts")
    name = models.CharField(max_length=255)
    content = models.TextField()  # For source maps or simple symbol maps
    content_type = models.CharField(max_length=100, default="text/plain")
    file_name = models.CharField(max_length=255, blank=True, default="")
    checksum = models.CharField(max_length=64, blank=True, default="")
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.release}::{self.name}"


class Comment(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="comments")
    author = models.CharField(max_length=200, default="system")
    body = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:  # pragma: no cover
        return f"comment:{self.group_id}:{self.author}"


class AlertRule(models.Model):
    TARGET_EMAIL = "email"
    TARGET_WEBHOOK = "webhook"

    TARGET_CHOICES = (
        (TARGET_EMAIL, "Email"),
        (TARGET_WEBHOOK, "Webhook"),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="alert_rules")
    name = models.CharField(max_length=200)
    level = models.CharField(max_length=20, blank=True, default="")  # optional level filter
    threshold_count = models.PositiveIntegerField(default=10)
    # Count events within this window when evaluating threshold
    threshold_window_minutes = models.PositiveIntegerField(default=5)
    # Minimum interval between notifications for a given group
    notify_interval_minutes = models.PositiveIntegerField(default=60)
    # Deprecated but kept for compat; used if notify_interval_minutes unset
    rearm_after_minutes = models.PositiveIntegerField(default=60)
    last_triggered_at = models.DateTimeField(null=True, blank=True)
    target_type = models.CharField(max_length=20, choices=TARGET_CHOICES, default=TARGET_EMAIL)
    target_value = models.CharField(max_length=500)  # email addr or webhook URL
    active = models.BooleanField(default=True)

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.project.slug}:{self.name}"


class AlertTarget(models.Model):
    TARGET_EMAIL = "email"
    TARGET_WEBHOOK = "webhook"

    TARGET_CHOICES = (
        (TARGET_EMAIL, "Email"),
        (TARGET_WEBHOOK, "Webhook"),
    )

    rule = models.ForeignKey('AlertRule', on_delete=models.CASCADE, related_name='targets')
    target_type = models.CharField(max_length=20, choices=TARGET_CHOICES)
    target_value = models.CharField(max_length=500)
    subject_template = models.CharField(max_length=255, blank=True, default="")
    body_template = models.TextField(blank=True, default="")

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.rule_id}:{self.target_type}:{self.target_value}"


class AlertState(models.Model):
    rule = models.ForeignKey('AlertRule', on_delete=models.CASCADE, related_name='states')
    group = models.ForeignKey('Group', on_delete=models.CASCADE, related_name='alert_states')
    last_triggered_at = models.DateTimeField(null=True, blank=True)
    suppress_until = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("rule", "group")

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.rule_id}:{self.group_id}"


class ReleaseDeployment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='deployments')
    release = models.ForeignKey(Release, on_delete=models.CASCADE, related_name='deployments')
    environment = models.CharField(max_length=64, default='production')
    name = models.CharField(max_length=200, blank=True, default='')
    url = models.CharField(max_length=500, blank=True, default='')
    date_started = models.DateTimeField(default=timezone.now)
    date_finished = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.project.slug}:{self.release.version}@{self.environment}"


class Session(models.Model):
    STATUS_CHOICES = (
        ("init", "init"),
        ("ok", "ok"),
        ("errored", "errored"),
        ("crashed", "crashed"),
        ("exited", "exited"),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='sessions')
    release = models.ForeignKey(Release, null=True, blank=True, on_delete=models.SET_NULL, related_name='sessions')
    environment = models.CharField(max_length=64, default='production')
    session_id = models.CharField(max_length=64)
    user = models.CharField(max_length=200, blank=True, default='')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='init')
    duration_ms = models.IntegerField(default=0)
    started_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("project", "session_id")

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.project.slug}:{self.session_id} [{self.status}]"
