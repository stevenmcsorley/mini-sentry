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
