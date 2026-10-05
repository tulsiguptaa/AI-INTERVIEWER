from django.urls import path
from .views import (
    sessions_view,
    session_detail_view,
    submit_answer_view,
    finish_session_view,
    analytics_overview_view,
)

urlpatterns = [
    path('sessions/', sessions_view, name='interview_sessions'),
    path('sessions/<int:session_id>/', session_detail_view, name='interview_session_detail'),
    path('sessions/<int:session_id>/submit-answer/', submit_answer_view, name='interview_submit_answer'),
    path('sessions/<int:session_id>/finish/', finish_session_view, name='interview_finish_session'),
    path('analytics/', analytics_overview_view, name='interview_analytics'),
]
