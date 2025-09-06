from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0006_alert_fields_snooze"),
    ]

    operations = [
        migrations.AddField(
            model_name='artifact',
            name='file_name',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='artifact',
            name='checksum',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
        migrations.AddField(
            model_name='event',
            name='stack',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='event',
            name='symbolicated',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.CreateModel(
            name='AlertTarget',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('target_type', models.CharField(choices=[('email', 'Email'), ('webhook', 'Webhook')], max_length=20)),
                ('target_value', models.CharField(max_length=500)),
                ('subject_template', models.CharField(blank=True, default='', max_length=255)),
                ('body_template', models.TextField(blank=True, default='')),
                ('rule', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='targets', to='events.alertrule')),
            ],
        ),
    ]

