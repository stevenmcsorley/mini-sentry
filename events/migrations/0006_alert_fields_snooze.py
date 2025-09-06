from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0005_alertstate_deployment_session"),
    ]

    operations = [
        migrations.AddField(
            model_name='alertrule',
            name='threshold_window_minutes',
            field=models.PositiveIntegerField(default=5),
        ),
        migrations.AddField(
            model_name='alertrule',
            name='notify_interval_minutes',
            field=models.PositiveIntegerField(default=60),
        ),
        migrations.AddField(
            model_name='alertstate',
            name='suppress_until',
            field=models.DateTimeField(null=True, blank=True),
        ),
    ]

