from django.urls import path
from .views import (
    signup_view,
    login_view,
    logout_view,
    current_user_view,
    google_auth_status_view,
    github_auth_status_view,
)

urlpatterns = [
    path('signup/', signup_view, name='signup'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('me/', current_user_view, name='current_user'),
    path('google/status/', google_auth_status_view, name='google_auth_status'),
    path('github/status/', github_auth_status_view, name='github_auth_status'),
]