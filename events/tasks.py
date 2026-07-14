import os
from datetime import timedelta
from django.utils import timezone
from celery import shared_task
from django.conf import settings
from .models import Event, Group
from .alerts import evaluate_alerts_for_event


@shared_task
def process_event(event_id: int):
    # Placeholder for async processing (symbolication, grouping, etc.)
    try:
        event = Event.objects.select_related("group", "project").get(id=event_id)
        evaluate_alerts_for_event(event)
    except Event.DoesNotExist:
        pass
    return {"event_id": event_id, "status": "processed"}


@shared_task
def sync_ossicone_ticket_statuses():
    """Keep Skylark groups in step with their Ossicone tickets: when the linked
    ticket is marked 'done', resolve the group (so a fixed bug stops showing as an
    unresolved error). Runs periodically."""
    from .models import IssueLink, Integration
    from .integrations import get_adapter
    adapter = get_adapter("ossicone")
    resolved = 0
    links = IssueLink.objects.filter(provider="ossicone").select_related("group", "group__project", "group__project__workspace")
    # newest link per group wins (a recurrence creates a fresh ticket)
    latest = {}
    for link in links.order_by("group_id", "-id"):
        latest.setdefault(link.group_id, link)
    for link in latest.values():
        g = link.group
        if g is None or g.status != Group.STATUS_UNRESOLVED or not link.external_id:
            continue
        ws = getattr(g.project, "workspace", None)
        integ = Integration.objects.filter(workspace=ws, provider="ossicone").first() if ws else None
        if not integ:
            continue
        try:
            st = adapter.issue_status(link.external_id, integ.config)
        except Exception:
            continue
        if st == "done":
            g.status = Group.STATUS_RESOLVED
            g.resolved_at = timezone.now()
            g.save(update_fields=["status", "resolved_at"])
            resolved += 1
    return {"resolved": resolved, "checked": len(latest)}


@shared_task
def cleanup_old_events():
    days = int(os.environ.get("RETENTION_DAYS", "30"))
    before = timezone.now() - timedelta(days=days)
    # Delete old events
    deleted, _ = Event.objects.filter(received_at__lt=before).delete()
    # Recalculate group counts and drop empties
    for grp in Group.objects.all():
        c = grp.events.count()
        if c == 0:
            grp.delete()
        else:
            if grp.count != c:
                grp.count = c
                grp.save(update_fields=["count"]) 
    return {"deleted": deleted, "before": before.isoformat()}
