import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from events.models import Project


class EventStreamConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.project_slug = self.scope['url_route']['kwargs']['project_slug']
        self.project_group_name = f"events_{self.project_slug}"
        
        # Verify project exists
        project_exists = await self.check_project_exists(self.project_slug)
        if not project_exists:
            await self.close(code=4004)  # Not Found
            return
        
        # Join project group
        await self.channel_layer.group_add(
            self.project_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection',
            'status': 'connected',
            'project': self.project_slug
        }))

    async def disconnect(self, close_code):
        # Leave project group
        if hasattr(self, 'project_group_name'):
            await self.channel_layer.group_discard(
                self.project_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        # Handle incoming WebSocket messages (ping/pong, etc.)
        try:
            data = json.loads(text_data)
            if data.get('type') == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
        except json.JSONDecodeError:
            pass

    # Receive message from project group
    async def new_event(self, event):
        # Send event to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'event',
            'id': event['event_id'],
            'project': event['project'],
            'level': event['level'],
            'message': event['message'],
            'timestamp': event['timestamp'],
            'environment': event['environment'],
            'fingerprint': event.get('fingerprint', '')
        }))

    @database_sync_to_async
    def check_project_exists(self, project_slug):
        try:
            Project.objects.get(slug=project_slug)
            return True
        except Project.DoesNotExist:
            return False