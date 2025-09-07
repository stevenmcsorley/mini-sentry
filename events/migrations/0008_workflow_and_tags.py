from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0007_alerttarget_artifact_event_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='tags',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='group',
            name='assignee',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AddField(
            model_name='group',
            name='is_bookmarked',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='group',
            name='resolved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='group',
            name='status',
            field=models.CharField(choices=[('unresolved', 'unresolved'), ('resolved', 'resolved'), ('ignored', 'ignored')], db_index=True, default='unresolved', max_length=20),
        ),
        migrations.CreateModel(
            name='Comment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('author', models.CharField(default='system', max_length=200)),
                ('body', models.TextField()),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('group', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='comments', to='events.group')),
            ],
        ),
    ]

