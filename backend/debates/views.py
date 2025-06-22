from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import DebateTopic, DebateSession, Message, Participation
from .serializers import DebateTopicSerializer, DebateSessionSerializer, MessageSerializer
from core.permissions import IsSessionModerator, CanPostMessage
from django.contrib.auth import get_user_model
from django.core.cache import cache

User = get_user_model()

class DebateTopicViewSet(viewsets.ModelViewSet):
    queryset = DebateTopic.objects.all()
    serializer_class = DebateTopicSerializer
    permission_classes = [IsAuthenticated] # Or IsAdminUser for topic management

class DebateSessionViewSet(viewsets.ModelViewSet):
    queryset = DebateSession.objects.all()
    serializer_class = DebateSessionSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def participants(self, request, pk=None):
        """Get current participants from cache (real-time WebSocket participants)."""
        cache_key = f'debate_participants_{pk}'
        participants = cache.get(cache_key, [])
        return Response({
            'participants': participants,
            'count': len(participants)
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def join(self, request, pk=None):
        session = self.get_object()
        Participation.objects.get_or_create(user=request.user, session=session)
        return Response({'status': 'user joined'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def leave(self, request, pk=None):
        session = self.get_object()
        Participation.objects.filter(user=request.user, session=session).delete()
        return Response({'status': 'user left'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsSessionModerator])
    def mute_participant(self, request, pk=None):
        session = self.get_object()
        user_id = request.data.get('user_id')
        user = get_object_or_404(User, id=user_id)
        participation, created = Participation.objects.get_or_create(user=user, session=session)
        participation.is_muted = True
        participation.save()
        return Response({'status': f'user {user.username} muted'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsSessionModerator])
    def unmute_participant(self, request, pk=None):
        session = self.get_object()
        user_id = request.data.get('user_id')
        user = get_object_or_404(User, id=user_id)
        participation, created = Participation.objects.get_or_create(user=user, session=session)
        participation.is_muted = False
        participation.save()
        return Response({'status': f'user {user.username} unmuted'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsSessionModerator])
    def remove_participant(self, request, pk=None):
        session = self.get_object()
        user_id = request.data.get('user_id')
        user = get_object_or_404(User, id=user_id)
        Participation.objects.filter(user=user, session=session).delete()
        return Response({'status': f'user {user.username} removed'}, status=status.HTTP_200_OK)

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated, CanPostMessage]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        # Filter messages by the session specified in the query parameter
        session_pk = self.request.query_params.get('session_pk')
        if session_pk:
            return self.queryset.filter(session_id=session_pk)
        return self.queryset.none() # Don't list all messages from all sessions

    def perform_create(self, serializer):
        session_pk = self.request.query_params.get('session_pk')
        session = get_object_or_404(DebateSession, pk=session_pk)
        serializer.save(author=self.request.user, session=session)