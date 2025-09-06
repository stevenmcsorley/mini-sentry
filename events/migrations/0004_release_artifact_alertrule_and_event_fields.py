from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0003_group_and_event_fk"),
    ]

    operations = [
        migrations.CreateModel(
            name="Release",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("version", models.CharField(max_length=200)),
                ("environment", models.CharField(default="production", max_length=64)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("date_released", models.DateTimeField(blank=True, null=True)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="releases", to="events.project")),
            ],
            options={"unique_together": {("project", "version", "environment")}},
        ),
        migrations.CreateModel(
            name="Artifact",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("content", models.TextField()),
                ("content_type", models.CharField(default="text/plain", max_length=100)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("release", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="artifacts", to="events.release")),
            ],
        ),
        migrations.CreateModel(
            name="AlertRule",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=200)),
                ("level", models.CharField(blank=True, default="", max_length=20)),
                ("threshold_count", models.PositiveIntegerField(default=10)),
                ("rearm_after_minutes", models.PositiveIntegerField(default=60)),
                ("last_triggered_at", models.DateTimeField(blank=True, null=True)),
                ("target_type", models.CharField(choices=[("email", "Email"), ("webhook", "Webhook")], default="email", max_length=20)),
                ("target_value", models.CharField(max_length=500)),
                ("active", models.BooleanField(default=True)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="alert_rules", to="events.project")),
            ],
        ),
        migrations.AddField(
            model_name="event",
            name="environment",
            field=models.CharField(default="production", max_length=64),
        ),
        migrations.AddField(
            model_name="event",
            name="release",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="events", to="events.release"),
        ),
    ]

