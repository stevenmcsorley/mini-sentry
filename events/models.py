import secrets
from django.conf import settings
from django.db import models
from django.utils import timezone


class Workspace(models.Model):
    """A tenant boundary: owns projects and has members."""
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:  # pragma: no cover
        return self.name


class WorkspaceMember(models.Model):
    ROLE_CHOICES = (("owner", "owner"), ("admin", "admin"), ("member", "member"))
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="workspace_memberships")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="member")
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("workspace", "user")


class WorkspaceInvite(models.Model):
    ROLE_CHOICES = (("admin", "admin"), ("member", "member"))
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name="invites")
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="member")
    token = models.CharField(max_length=64, unique=True, blank=True)
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+")
    expires_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(24)
        return super().save(*args, **kwargs)


class ApiToken(models.Model):
    """A scoped API token for programmatic access (MCP / CI), bound to a workspace."""
    token = models.CharField(max_length=64, unique=True, blank=True)
    name = models.CharField(max_length=200)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name="api_tokens")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+")
    last_used_at = models.DateTimeField(null=True, blank=True)
    revoked = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(32)
        return super().save(*args, **kwargs)


class Integration(models.Model):
    """Per-workspace config for an external issue tracker (see events/integrations.py)."""
    PROVIDERS = (("github", "github"), ("ossicone", "ossicone"))
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name="integrations")
    provider = models.CharField(max_length=32, choices=PROVIDERS)
    config = models.JSONField(default=dict)  # e.g. {owner,repo,token} or {url,token,project_id}
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("workspace", "provider")


class IssueLink(models.Model):
    """A Skylark error group linked to an external issue/ticket."""
    group = models.ForeignKey("Group", on_delete=models.CASCADE, related_name="issue_links")
    provider = models.CharField(max_length=32)
    url = models.URLField(max_length=500)
    external_id = models.CharField(max_length=64, blank=True)
    external_key = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(default=timezone.now)


class Project(models.Model):
    # Name is unique per-workspace (see Meta), not globally — two workspaces can
    # each have a project called "Ossicone". Slug stays globally unique (it's the URL key).
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    workspace = models.ForeignKey(Workspace, null=True, blank=True, on_delete=models.CASCADE, related_name="projects")
    created_at = models.DateTimeField(default=timezone.now)
    ingest_token = models.CharField(max_length=64, unique=True, blank=True)
    # Human-written "what does this project track?" notes — shown on the project
    # overview and readable/writable by the MCP so a fresh session isn't lost.
    description = models.TextField(blank=True, default="")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["workspace", "name"], name="uniq_project_workspace_name"),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return self.slug

    def save(self, *args, **kwargs):
        if not self.ingest_token:
            # 43 chars from token_urlsafe(32); cap to 48 for readability
            self.ingest_token = secrets.token_urlsafe(32)[:48]
        return super().save(*args, **kwargs)


class TrackingItem(models.Model):
    """A declared monitor: 'here is a place I set up to send errors to Skylark'.

    This is the intent/inventory — what SHOULD be tracked — maintained by the MCP
    (or a human) so everyone can see what's being monitored, and compare it against
    what data is actually arriving. Distinct from Event (the data that flows in).
    """
    SOURCE_CHOICES = (
        ("frontend", "frontend"), ("backend", "backend"), ("mobile", "mobile"),
        ("infra", "infra"), ("job", "job"), ("test", "test"), ("other", "other"),
    )
    STATUS_ACTIVE = "active"
    STATUS_PLANNED = "planned"
    STATUS_REMOVED = "removed"
    STATUS_CHOICES = ((STATUS_ACTIVE, "active"), (STATUS_PLANNED, "planned"), (STATUS_REMOVED, "removed"))

    project = models.ForeignKey("Project", on_delete=models.CASCADE, related_name="tracking_items")
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="other")
    kind = models.CharField(max_length=200)  # e.g. "window.onerror", "NestJS 5xx exception filter"
    detail = models.TextField(blank=True, default="")  # what it captures / why
    location = models.CharField(max_length=300, blank=True, default="")  # file path or endpoint
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    origin = models.CharField(max_length=20, default="mcp")  # who declared it: mcp | human
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
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
