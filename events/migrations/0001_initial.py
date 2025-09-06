from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Project",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=200, unique=True)),
                ("slug", models.SlugField(unique=True)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
            ],
        ),
        migrations.CreateModel(
            name="Event",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("message", models.TextField()),
                ("level", models.CharField(choices=[("error", "error"), ("warning", "warning"), ("info", "info")], default="error", max_length=20)),
                ("payload", models.JSONField(blank=True, default=dict)),
                ("received_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="events", to="events.project")),
            ],
        ),
    ]

