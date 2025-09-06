from django.shortcuts import render, redirect, get_object_or_404
from django.utils.text import slugify
from .models import Project, Event, Group


def projects_page(request):
    if request.method == "POST":
        name = request.POST.get("name", "").strip()
        slug = request.POST.get("slug", "").strip() or slugify(name)
        if name and slug and not Project.objects.filter(slug=slug).exists():
            Project.objects.create(name=name, slug=slug)
            return redirect("projects_page")
    projects = Project.objects.all().order_by("-id")
    return render(request, "projects.html", {"projects": projects})


def project_events_page(request, slug):
    project = get_object_or_404(Project, slug=slug)
    events = project.events.all().order_by("-received_at")[:200]
    groups = project.groups.all().order_by("-last_seen")[:100]
    return render(
        request,
        "events.html",
        {"project": project, "events": events, "groups": groups},
    )
