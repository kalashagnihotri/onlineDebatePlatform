import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import DebateSession

User = get_user_model()

class DebateConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.debate_id = self.scope['url_route']['kwargs']['debate_id']
        self.room_group_name = f'debate_{self.debate_id}'
        
        # Get the token from query parameters
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1]
                break
        
        if not token:
            await self.close()
            return
        
        # Authenticate user
        user = await self.get_user_from_token(token)
        if not user:
            await self.close()
            return
        
        # Check if debate session exists
        debate_session = await self.get_debate_session(self.debate_id)
        if not debate_session:
            await self.close()
            return
        
        self.user = user
        self.debate_session = debate_session
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Connected to debate session {self.debate_id}',
            'user_id': user.id,
            'username': user.username
        }))

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'message')
        message = text_data_json.get('message', '')
        
        if message_type == 'message':
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'debate_message',
                    'message': message,
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'timestamp': text_data_json.get('timestamp')
                }
            )
        elif message_type == 'join_debate':
            # Handle user joining debate
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_joined',
                    'user_id': self.user.id,
                    'username': self.user.username
                }
            )

    async def debate_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event['message'],
            'user_id': event['user_id'],
            'username': event['username'],
            'timestamp': event.get('timestamp')
        }))

    async def user_joined(self, event):
        # Send user joined notification
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            'user_id': event['user_id'],
            'username': event['username']
        }))

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            return User.objects.get(id=user_id)
        except (InvalidToken, TokenError, User.DoesNotExist):
            return None

    @database_sync_to_async
    def get_debate_session(self, debate_id):
        try:
            return DebateSession.objects.get(id=debate_id)
        except DebateSession.DoesNotExist:
            return None 