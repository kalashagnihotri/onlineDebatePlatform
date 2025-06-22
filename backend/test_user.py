from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

# Create or get a test user
user, created = User.objects.get_or_create(username='testuser', defaults={'email': 'test@example.com'})
if created:
    user.set_password('testpass123')
    user.save()

# Generate a fresh JWT access token
token = AccessToken.for_user(user)

print(f"Username: {user.username}")
print(f"Fresh JWT Token: {str(token)}")
print(f"User ID: {user.id}")
print(f"User Email: {user.email}")