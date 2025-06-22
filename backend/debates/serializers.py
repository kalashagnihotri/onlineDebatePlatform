from rest_framework import serializers
from .models import DebateTopic, DebateSession, Message, Participation
from users.serializers import UserSerializer

class MessageSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'session', 'author', 'content', 'timestamp']

class DebateTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = DebateTopic
        fields = ['id', 'title', 'description', 'created_at']

class ParticipationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Participation
        fields = ['user', 'is_muted']

class DebateSessionSerializer(serializers.ModelSerializer):
    topic = DebateTopicSerializer(read_only=True)
    topic_id = serializers.IntegerField(write_only=True)
    moderator = UserSerializer(read_only=True)
    participants = ParticipationSerializer(source='participation_set', many=True, read_only=True)
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = DebateSession
        fields = ['id', 'topic', 'topic_id', 'moderator', 'start_time', 'end_time', 'participants', 'messages']