from django.db import models
from django.conf import settings

class Participation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    session = models.ForeignKey('DebateSession', on_delete=models.CASCADE)
    is_muted = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'session')

class DebateTopic(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class DebateSession(models.Model):
    topic = models.ForeignKey(DebateTopic, on_delete=models.CASCADE)
    moderator = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='moderated_sessions', on_delete=models.SET_NULL, null=True)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='debate_sessions', blank=True, through='Participation')

    def __str__(self):
        moderator_username = self.moderator.username if self.moderator else 'No Moderator'
        return f"Session on {self.topic.title} moderated by {moderator_username}"

class Message(models.Model):
    session = models.ForeignKey(DebateSession, related_name='messages', on_delete=models.CASCADE)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Message by {self.author.username} in {self.session.topic.title}'

    class Meta:
        ordering = ['timestamp']