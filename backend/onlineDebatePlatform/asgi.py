import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

# Set up Django settings before importing routing
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'onlineDebatePlatform.settings')
django.setup()

# Import routing after Django is set up
import debates.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            debates.routing.websocket_urlpatterns
        )
    ),
}) 