from django.db import migrations


def backfill(apps, schema_editor):
    Workspace = apps.get_model("events", "Workspace")
    WorkspaceMember = apps.get_model("events", "WorkspaceMember")
    Project = apps.get_model("events", "Project")
    User = apps.get_model("auth", "User")

    # Only seed a Default workspace when there is pre-existing data to adopt.
    # Fresh installs let the first registered user create their own workspace.
    has_orphans = Project.objects.filter(workspace__isnull=True).exists()
    if not has_orphans and not User.objects.exists():
        return

    ws = Workspace.objects.create(name="Default")
    Project.objects.filter(workspace__isnull=True).update(workspace=ws)

    for i, user in enumerate(User.objects.all().order_by("id")):
        role = "owner" if (user.is_superuser or i == 0) else "member"
        WorkspaceMember.objects.get_or_create(
            workspace=ws, user=user, defaults={"role": role}
        )


def reverse(apps, schema_editor):
    Workspace = apps.get_model("events", "Workspace")
    Workspace.objects.filter(name="Default").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0009_workspace_project_workspace_workspaceinvite_and_more"),
    ]

    operations = [
        migrations.RunPython(backfill, reverse),
    ]
