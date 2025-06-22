from django.urls import path
from .views import UserRegistrationView, UserListView, UserDetailView, user_profile

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('profile/', user_profile, name='user-profile'),
    path('', UserListView.as_view(), name='user-list'),
    path('<int:pk>/', UserDetailView.as_view(), name='user-detail'),
]