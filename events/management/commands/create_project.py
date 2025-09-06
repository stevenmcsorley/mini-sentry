from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from events.models import Project


class Command(BaseCommand):
    help = "Create a project and print its ingest token"

    def add_arguments(self, parser):
        parser.add_argument("name", type=str, help="Project name")
        parser.add_argument("--slug", type=str, default=None, help="Optional slug")

    def handle(self, *args, **options):
        name = options["name"]
        slug = options["slug"] or slugify(name)

        if Project.objects.filter(slug=slug).exists():
            raise CommandError(f"Project with slug '{slug}' already exists")

        project = Project.objects.create(name=name, slug=slug)
        self.stdout.write(self.style.SUCCESS("Project created"))
        self.stdout.write(f"Name: {project.name}")
        self.stdout.write(f"Slug: {project.slug}")
        self.stdout.write(f"Ingest Token: {project.ingest_token}")
        self.stdout.write(
            "Token ingest endpoint: POST /api/events/ingest/token/{token}".format(
                token=project.ingest_token
            )
        )

