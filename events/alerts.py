import os
from datetime import timedelta
from typing import Optional

import requests
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import Event, AlertRule, Group, AlertState, AlertTarget


def _should_trigger(rule: AlertRule, group: Group, event: Event) -> bool:
    if not rule.active:
        return False
    if rule.level and group.level != rule.level:
        return False
    # Respect per-group suppression window
    state, _ = AlertState.objects.get_or_create(rule=rule, group=group)
    if state.suppress_until and timezone.now() < state.suppress_until:
        return False
    # Windowed count within threshold window
    window_minutes = rule.threshold_window_minutes or 5
    since = timezone.now() - timedelta(minutes=window_minutes)
    recent_count = group.events.filter(received_at__gte=since).count()
    if recent_count < rule.threshold_count:
        return False
    # Per-group state
    notify_gap = rule.notify_interval_minutes or rule.rearm_after_minutes or 60
    if state.last_triggered_at:
        diff = timezone.now() - state.last_triggered_at
        if diff < timedelta(minutes=notify_gap):
            return False
    return True


def _build_payload(event: Event) -> dict:
    return {
        "project": event.project.slug,
        "group_id": event.group_id,
        "group_title": event.group.title if event.group else None,
        "level": event.level,
        "message": event.message,
        "count": event.group.count if event.group else None,
        "received_at": event.received_at.isoformat(),
    }


def trigger_alert(rule: AlertRule, event: Event):
    payload = _build_payload(event)
    # default subject/body
    default_subject = f"[Mini Sentry] {payload['project']} - {payload['group_title']}"
    default_body = (
        f"Project: {payload['project']}\n"
        f"Group: {payload['group_id']} - {payload['group_title']}\n"
        f"Level: {payload['level']}\n"
        f"Count: {payload['count']}\n"
        f"Time: {payload['received_at']}\n"
        f"Message: {payload['message']}\n"
    )
    targets = list(rule.targets.all()) or [
        AlertTarget(rule=rule, target_type=rule.target_type, target_value=rule.target_value)
    ]
    for t in targets:
        subj = (t.subject_template or default_subject)
        body = (t.body_template or default_body)
        try:
            subj_fmt = subj.format(**payload)
        except Exception:
            subj_fmt = subj
        try:
            body_fmt = body.format(**payload)
        except Exception:
            body_fmt = body
        if t.target_type == AlertTarget.TARGET_EMAIL:
            from_email = os.environ.get("EMAIL_FROM", "alerts@example.test")
            try:
                send_mail(subj_fmt, body_fmt, from_email, [t.target_value], fail_silently=True)
            except Exception:
                pass
        elif t.target_type == AlertTarget.TARGET_WEBHOOK:
            try:
                requests.post(t.target_value, json=payload, timeout=3)
            except Exception:
                pass
    # Update per-group rearm state
    if event.group_id:
        AlertState.objects.update_or_create(
            rule=rule,
            group=event.group,
            defaults={"last_triggered_at": timezone.now()},
        )


def evaluate_alerts_for_event(event: Event):
    if not event.group:
        return
    rules = AlertRule.objects.filter(project=event.project, active=True)
    for rule in rules:
        if _should_trigger(rule, event.group, event):
            trigger_alert(rule, event)
