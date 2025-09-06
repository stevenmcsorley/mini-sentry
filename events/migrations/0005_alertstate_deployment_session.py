from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0004_release_artifact_alertrule_and_event_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="AlertState",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("last_triggered_at", models.DateTimeField(blank=True, null=True)),
                ("group", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="alert_states", to="events.group")),
                ("rule", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="states", to="events.alertrule")),
            ],
            options={"unique_together": {("rule", "group")}},
        ),
        migrations.CreateModel(
            name="ReleaseDeployment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("environment", models.CharField(default="production", max_length=64)),
                ("name", models.CharField(blank=True, default="", max_length=200)),
                ("url", models.CharField(blank=True, default="", max_length=500)),
                ("date_started", models.DateTimeField(default=django.utils.timezone.now)),
                ("date_finished", models.DateTimeField(blank=True, null=True)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="deployments", to="events.project")),
                ("release", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="deployments", to="events.release")),
            ],
        ),
        migrations.CreateModel(
            name="Session",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("environment", models.CharField(default="production", max_length=64)),
                ("session_id", models.CharField(max_length=64)),
                ("user", models.CharField(blank=True, default="", max_length=200)),
                ("status", models.CharField(choices=[("init", "init"), ("ok", "ok"), ("errored", "errored"), ("crashed", "crashed"), ("exited", "exited")], default="init", max_length=16)),
                ("duration_ms", models.IntegerField(default=0)),
                ("started_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="sessions", to="events.project")),
                ("release", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="sessions", to="events.release")),
            ],
            options={"unique_together": {("project", "session_id")}},
        ),
    ]
