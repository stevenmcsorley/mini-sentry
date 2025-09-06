from django.db import migrations, models
import django.utils.timezone


def gen_tokens(apps, schema_editor):
    Project = apps.get_model('events', 'Project')
    import secrets
    for p in Project.objects.all():
        if not p.ingest_token:
            p.ingest_token = secrets.token_urlsafe(32)[:48]
            p.save(update_fields=['ingest_token'])


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='ingest_token',
            field=models.CharField(blank=True, max_length=64, unique=True),
        ),
        migrations.RunPython(gen_tokens, migrations.RunPython.noop),
    ]

