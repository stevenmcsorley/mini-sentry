from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0002_project_ingest_token"),
    ]

    operations = [
        migrations.CreateModel(
            name="Group",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("fingerprint", models.CharField(max_length=512, db_index=True)),
                ("title", models.CharField(max_length=255)),
                ("level", models.CharField(max_length=20, default="error")),
                ("count", models.PositiveIntegerField(default=0)),
                ("first_seen", models.DateTimeField(default=django.utils.timezone.now)),
                ("last_seen", models.DateTimeField(default=django.utils.timezone.now)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="groups", to="events.project")),
            ],
            options={
                "unique_together": {("project", "fingerprint")},
            },
        ),
        migrations.AddField(
            model_name="event",
            name="group",
            field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.SET_NULL, related_name="events", to="events.group"),
        ),
    ]

