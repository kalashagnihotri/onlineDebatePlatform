from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DebateTopicViewSet, DebateSessionViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'topics', DebateTopicViewSet, basename='topic')
router.register(r'sessions', DebateSessionViewSet, basename='session')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [
    path('', include(router.urls)),
]