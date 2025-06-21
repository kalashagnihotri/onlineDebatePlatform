from django.contrib import admin
from .models import DebateTopic, DebateSession, Message

class DebateTopicAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at', 'updated_at')
    search_fields = ('title',)

class DebateSessionAdmin(admin.ModelAdmin):
    list_display = ('topic', 'start_time', 'end_time', 'status')
    list_filter = ('status',)

class MessageAdmin(admin.ModelAdmin):
    list_display = ('session', 'user', 'content', 'timestamp')
    search_fields = ('content',)

admin.site.register(DebateTopic, DebateTopicAdmin)
admin.site.register(DebateSession, DebateSessionAdmin)
admin.site.register(Message, MessageAdmin)