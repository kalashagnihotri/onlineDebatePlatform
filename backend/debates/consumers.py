import json
import asyncio
import logging
from datetime import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import DebateSession

User = get_user_model()
logger = logging.getLogger(__name__)

class DebateConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.typing_timeout = None

    async def connect(self):
        logger.info(f"WebSocket connection attempt started")
        
        self.debate_id = self.scope['url_route']['kwargs']['debate_id']
        self.room_group_name = f'debate_{self.debate_id}'
        
        logger.info(f"Debate ID: {self.debate_id}, Room: {self.room_group_name}")
        
        # Get the token from query parameters
        query_string = self.scope.get('query_string', b'').decode()
        logger.info(f"Query string: {query_string}")
        
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1]
                break
        
        if not token:
            logger.error(f"REJECT: No token in query: {query_string}")
            await self.close(code=4001)
            return
        
        logger.info(f"Token found, authenticating user...")
        
        # Authenticate user
        user = await self.get_user_from_token(token)
        if not user:
            logger.error(f"REJECT: Invalid token or user not found")
            await self.close(code=4002)
            return
        
        logger.info(f"User authenticated: {user.username} (ID: {user.id})")
        
        # Check if debate session exists
        debate_session = await self.get_debate_session(self.debate_id)
        if not debate_session:
            logger.error(f"REJECT: Debate session {self.debate_id} not found")
            await self.close(code=4003)
            return
        
        logger.info(f"Debate session found: {debate_session.topic}")
        
        self.user = user
        self.debate_session = debate_session
        
        logger.info(f"Joining room group: {self.room_group_name}")
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )        
        
        logger.info(f"Accepting WebSocket connection for user: {user.username}")
        await self.accept()
        
        # Add user to participants and notify others
        await self.add_participant()
        
        # Send connection confirmation with current participants
        participants = await self.get_participants()
        logger.info(f"Sending connection confirmation to {user.username}")
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Connected to debate session {self.debate_id}',
            'user_id': user.id,
            'username': user.username,
            'participants': participants        }))
        
        # Notify others that user joined
        logger.info(f"Notifying room that {user.username} joined")
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_joined',
                'user_id': self.user.id,
                'username': self.user.username,
                'participants': participants
            }
        )
        logger.info(f"WebSocket connection completed successfully for user: {user.username}")

    async def disconnect(self, close_code):
        logger.info(f"WebSocket disconnect initiated with code: {close_code}")
        
        # Remove user from participants and notify others
        if hasattr(self, 'user'):
            logger.info(f"User {self.user.username} disconnecting")
            await self.remove_participant()
            participants = await self.get_participants()
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_left',
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'participants': participants
                }
            )
        else:
            logger.warning("Disconnect called but no user was set")
        
        # Leave room group
        if hasattr(self, 'room_group_name'):
            logger.info(f"Leaving room group: {self.room_group_name}")
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        
        logger.info("WebSocket disconnect completed")

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'message')
        
        if message_type == 'message':
            message = text_data_json.get('message', '')
            emoji_reactions = text_data_json.get('emoji_reactions', {})
            image_url = text_data_json.get('image_url', '')
            
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'debate_message',
                    'message': message,
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'timestamp': datetime.now().isoformat(),
                    'emoji_reactions': emoji_reactions,
                    'image_url': image_url
                }
            )
            
        elif message_type == 'typing_start':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_notification',
                    'action': 'start',
                    'user_id': self.user.id,
                    'username': self.user.username
                }
            )
            
        elif message_type == 'typing_stop':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_notification',
                    'action': 'stop',
                    'user_id': self.user.id,
                    'username': self.user.username
                }
            )
            
        elif message_type == 'reaction':
            message_id = text_data_json.get('message_id')
            emoji = text_data_json.get('emoji')
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'message_reaction',
                    'message_id': message_id,
                    'emoji': emoji,
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
            'timestamp': event.get('timestamp'),
            'emoji_reactions': event.get('emoji_reactions', {}),
            'image_url': event.get('image_url', '')
        }))

    async def user_joined(self, event):
        # Send user joined notification
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            'user_id': event['user_id'],
            'username': event['username'],
            'participants': event.get('participants', [])
        }))

    async def user_left(self, event):
        # Send user left notification
        await self.send(text_data=json.dumps({
            'type': 'user_left',
            'user_id': event['user_id'],
            'username': event['username'],
            'participants': event.get('participants', [])
        }))

    async def typing_notification(self, event):
        # Don't send typing notification back to the sender
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': f"typing_{event['action']}",
                'user_id': event['user_id'],
                'username': event['username']
            }))

    async def message_reaction(self, event):
        # Send reaction notification
        await self.send(text_data=json.dumps({
            'type': 'reaction',
            'message_id': event['message_id'],
            'emoji': event['emoji'],
            'user_id': event['user_id'],
            'username': event['username']
        }))

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            logger.info(f"Attempting to validate token...")
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            logger.info(f"Token valid, user_id: {user_id}")
            user = User.objects.get(id=user_id)
            logger.info(f"User found: {user.username}")
            return user
        except (InvalidToken, TokenError) as e:
            logger.error(f"Token validation failed: {e}")
            return None
        except User.DoesNotExist:
            logger.error(f"User with id {user_id} does not exist")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during token validation: {e}")
            return None

    @database_sync_to_async
    def get_debate_session(self, debate_id):
        try:
            logger.info(f"Looking up debate session: {debate_id}")
            session = DebateSession.objects.get(id=debate_id)
            logger.info(f"Debate session found: {session.topic}")
            return session
        except DebateSession.DoesNotExist:
            logger.error(f"Debate session {debate_id} does not exist")
            return None
        except Exception as e:
            logger.error(f"Unexpected error looking up debate session: {e}")
            return None

    @database_sync_to_async
    def add_participant(self):
        # Add user to active participants (you might want to store this in Redis or database)
        # For now, we'll use channel layer's group membership
        pass

    @database_sync_to_async
    def remove_participant(self):
        # Remove user from active participants
        pass

    @database_sync_to_async
    def get_participants(self):
        # Get list of active participants
        # For now, return a simple list - you can enhance this with actual participant tracking
        return [
            {
                'id': self.user.id,
                'username': self.user.username,
                'is_online': True
            }
        ]