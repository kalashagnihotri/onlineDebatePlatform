from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/debates/(?P<debate_id>\d+)/$', consumers.DebateConsumer.as_asgi()),
]