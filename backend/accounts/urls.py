from django.urls import path
from .views import (
    signup_view,
    login_view,
    logout_view,
    current_user_view,
    google_auth_status_view,
    github_auth_status_view,
    resume_upload_view,
    resume_list_view,
    latest_resume_view,
    resume_delete_view,
    resume_download_view,
)

urlpatterns = [
    path('signup/', signup_view, name='signup'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('me/', current_user_view, name='current_user'),
    path('google/status/', google_auth_status_view, name='google_auth_status'),
    path('github/status/', github_auth_status_view, name='github_auth_status'),

    # Resume endpoints (User-isolated storage & analysis)
    path('resumes/upload/', resume_upload_view, name='resume_upload'),
    path('resumes/', resume_list_view, name='resume_list'),
    path('resumes/latest/', latest_resume_view, name='resume_latest'),
    path('resumes/<int:resume_id>/', resume_delete_view, name='resume_delete'),
    path('resumes/<int:resume_id>/download/', resume_download_view, name='resume_download'),
]