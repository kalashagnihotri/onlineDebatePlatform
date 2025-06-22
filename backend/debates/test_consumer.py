"""
Test module for WebSocket consumer functionality.
Tests the DebateConsumer class and its various message handling capabilities.
"""

import json
import pytest
from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from django.test import TransactionTestCase
from rest_framework_simplejwt.tokens import AccessToken

from debates.consumers import DebateConsumer
from debates.models import Debate, DebateMessage
from users.models import UserProfile


class TestDebateConsumer(TransactionTestCase):
    """Test cases for the DebateConsumer WebSocket consumer."""
    
    def setUp(self):
        """Set up test data for each test."""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )
        self.user_profile = UserProfile.objects.create(user=self.user)
        
        self.debate = Debate.objects.create(
            title='Test Debate',
            description='A test debate for WebSocket testing',
            created_by=self.user,
            status='active'
        )
        
        # Generate JWT token for authentication
        self.token = AccessToken.for_user(self.user)
        
    async def test_websocket_connect_with_valid_token(self):
        """Test WebSocket connection with valid JWT token."""
        communicator = WebsocketCommunicator(
            DebateConsumer.as_asgi(),
            f"/ws/debates/{self.debate.id}/?token={self.token}"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Should receive a welcome message
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'connection_established')
        self.assertEqual(response['user'], self.user.username)
        
        await communicator.disconnect()
        
    async def test_websocket_connect_without_token(self):
        """Test WebSocket connection without authentication token."""
        communicator = WebsocketCommunicator(
            DebateConsumer.as_asgi(),
            f"/ws/debates/{self.debate.id}/"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertFalse(connected)
        
    async def test_websocket_connect_with_invalid_token(self):
        """Test WebSocket connection with invalid JWT token."""
        communicator = WebsocketCommunicator(
            DebateConsumer.as_asgi(),
            f"/ws/debates/{self.debate.id}/?token=invalid_token"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertFalse(connected)
        
    async def test_chat_message_sending(self):
        """Test sending and receiving chat messages."""
        communicator = WebsocketCommunicator(
            DebateConsumer.as_asgi(),
            f"/ws/debates/{self.debate.id}/?token={self.token}"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Skip the connection established message
        await communicator.receive_json_from()
        
        # Send a chat message
        message_data = {
            'type': 'chat_message',
            'message': 'Hello, this is a test message!'
        }
        await communicator.send_json_to(message_data)
        
        # Should receive the message back
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'chat_message')
        self.assertEqual(response['message'], 'Hello, this is a test message!')
        self.assertEqual(response['user'], self.user.username)
        self.assertIn('timestamp', response)
        
        await communicator.disconnect()
        
    async def test_typing_indicator(self):
        """Test typing indicator functionality."""
        communicator = WebsocketCommunicator(
            DebateConsumer.as_asgi(),
            f"/ws/debates/{self.debate.id}/?token={self.token}"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Skip the connection established message
        await communicator.receive_json_from()
        
        # Send typing indicator
        typing_data = {
            'type': 'typing_indicator',
            'is_typing': True
        }
        await communicator.send_json_to(typing_data)
        
        # Should receive typing indicator
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'typing_indicator')
        self.assertEqual(response['user'], self.user.username)
        self.assertTrue(response['is_typing'])
        
        await communicator.disconnect()
        
    async def test_reaction_sending(self):
        """Test sending emoji reactions."""
        communicator = WebsocketCommunicator(
            DebateConsumer.as_asgi(),
            f"/ws/debates/{self.debate.id}/?token={self.token}"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Skip the connection established message
        await communicator.receive_json_from()
        
        # Send a reaction
        reaction_data = {
            'type': 'reaction',
            'emoji': '👍',
            'target_type': 'debate',
            'target_id': str(self.debate.id)
        }
        await communicator.send_json_to(reaction_data)
        
        # Should receive the reaction back
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'reaction')
        self.assertEqual(response['emoji'], '👍')
        self.assertEqual(response['user'], self.user.username)
        
        await communicator.disconnect()
        
    async def test_participant_list_update(self):
        """Test participant list updates when users join/leave."""
        # Create two communicators for two different users
        user2 = await database_sync_to_async(User.objects.create_user)(
            username='testuser2',
            password='testpass123',
            email='test2@example.com'
        )
        await database_sync_to_async(UserProfile.objects.create)(user=user2)
        token2 = AccessToken.for_user(user2)
        
        # First user connects
        communicator1 = WebsocketCommunicator(
            DebateConsumer.as_asgi(),
            f"/ws/debates/{self.debate.id}/?token={self.token}"
        )
        connected, _ = await communicator1.connect()
        self.assertTrue(connected)
        
        # Skip connection message
        await communicator1.receive_json_from()
        
        # Second user connects
        communicator2 = WebsocketCommunicator(
            DebateConsumer.as_asgi(),
            f"/ws/debates/{self.debate.id}/?token={token2}"
        )
        connected, _ = await communicator2.connect()
        self.assertTrue(connected)
        
        # First user should receive participant update
        response = await communicator1.receive_json_from()
        self.assertEqual(response['type'], 'participant_update')
        self.assertIn('testuser2', response['participants'])
        
        # Second user should receive connection message and participant list
        await communicator2.receive_json_from()  # connection established
        
        await communicator1.disconnect()
        await communicator2.disconnect()
        
    async def test_message_persistence(self):
        """Test that chat messages are saved to database."""
        communicator = WebsocketCommunicator(
            DebateConsumer.as_asgi(),
            f"/ws/debates/{self.debate.id}/?token={self.token}"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Skip the connection established message
        await communicator.receive_json_from()
        
        # Send a chat message
        message_text = 'This message should be saved to database'
        message_data = {
            'type': 'chat_message',
            'message': message_text
        }
        await communicator.send_json_to(message_data)
        
        # Receive the message
        await communicator.receive_json_from()
        
        # Check if message was saved to database
        message_exists = await database_sync_to_async(
            DebateMessage.objects.filter(
                debate=self.debate,
                user=self.user,
                content=message_text
            ).exists
        )()
        self.assertTrue(message_exists)
        
        await communicator.disconnect()
        
    async def test_invalid_message_type(self):
        """Test handling of invalid message types."""
        communicator = WebsocketCommunicator(
            DebateConsumer.as_asgi(),
            f"/ws/debates/{self.debate.id}/?token={self.token}"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Skip the connection established message
        await communicator.receive_json_from()
        
        # Send invalid message type
        invalid_data = {
            'type': 'invalid_message_type',
            'data': 'some data'
        }
        await communicator.send_json_to(invalid_data)
        
        # Should receive error message
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'error')
        self.assertIn('Unknown message type', response['message'])
        
        await communicator.disconnect()
        
    async def test_empty_message_handling(self):
        """Test handling of empty or malformed messages."""
        communicator = WebsocketCommunicator(
            DebateConsumer.as_asgi(),
            f"/ws/debates/{self.debate.id}/?token={self.token}"
        )
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Skip the connection established message
        await communicator.receive_json_from()
        
        # Send empty chat message
        empty_message_data = {
            'type': 'chat_message',
            'message': ''
        }
        await communicator.send_json_to(empty_message_data)
        
        # Should receive error for empty message
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'error')
        self.assertIn('Message cannot be empty', response['message'])
        
        await communicator.disconnect()


class TestDebateConsumerIntegration(TransactionTestCase):
    """Integration tests for multiple users in a debate room."""
    
    def setUp(self):
        """Set up test data with multiple users."""
        self.user1 = User.objects.create_user(
            username='user1',
            password='testpass123',
            email='user1@example.com'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            password='testpass123',
            email='user2@example.com'
        )
        
        UserProfile.objects.create(user=self.user1)
        UserProfile.objects.create(user=self.user2)
        
        self.debate = Debate.objects.create(
            title='Multi-user Test Debate',
            description='Testing multiple users in one debate',
            created_by=self.user1,
            status='active'
        )
        
        self.token1 = AccessToken.for_user(self.user1)
        self.token2 = AccessToken.for_user(self.user2)
        
    async def test_multiple_users_chat(self):
        """Test chat between multiple users."""
        # Connect both users
        communicator1 = WebsocketCommunicator(
            DebateConsumer.as_asgi(),
            f"/ws/debates/{self.debate.id}/?token={self.token1}"
        )
        communicator2 = WebsocketCommunicator(
            DebateConsumer.as_asgi(),
            f"/ws/debates/{self.debate.id}/?token={self.token2}"
        )
        
        connected1, _ = await communicator1.connect()
        connected2, _ = await communicator2.connect()
        self.assertTrue(connected1)
        self.assertTrue(connected2)
        
        # Clear initial messages
        await communicator1.receive_json_from()  # connection established
        await communicator1.receive_json_from()  # participant update (user2 joined)
        await communicator2.receive_json_from()  # connection established
        
        # User1 sends message
        message_data = {
            'type': 'chat_message',
            'message': 'Hello from user1!'
        }
        await communicator1.send_json_to(message_data)
        
        # Both users should receive the message
        response1 = await communicator1.receive_json_from()
        response2 = await communicator2.receive_json_from()
        
        self.assertEqual(response1['message'], 'Hello from user1!')
        self.assertEqual(response2['message'], 'Hello from user1!')
        self.assertEqual(response1['user'], 'user1')
        self.assertEqual(response2['user'], 'user1')
        
        await communicator1.disconnect()
        await communicator2.disconnect()
        
    async def test_user_leave_notification(self):
        """Test notification when user leaves the debate."""
        # Connect both users
        communicator1 = WebsocketCommunicator(
            DebateConsumer.as_asgi(),
            f"/ws/debates/{self.debate.id}/?token={self.token1}"
        )
        communicator2 = WebsocketCommunicator(
            DebateConsumer.as_asgi(),
            f"/ws/debates/{self.debate.id}/?token={self.token2}"
        )
        
        connected1, _ = await communicator1.connect()
        connected2, _ = await communicator2.connect()
        
        # Clear initial messages
        await communicator1.receive_json_from()  # connection established
        await communicator1.receive_json_from()  # participant update
        await communicator2.receive_json_from()  # connection established
        
        # User2 disconnects
        await communicator2.disconnect()
        
        # User1 should receive participant update
        response = await communicator1.receive_json_from()
        self.assertEqual(response['type'], 'participant_update')
        self.assertNotIn('user2', response['participants'])
        
        await communicator1.disconnect()
