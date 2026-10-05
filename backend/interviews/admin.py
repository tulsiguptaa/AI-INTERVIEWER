from django.contrib import admin
from .models import InterviewSession, InterviewQuestion


class InterviewQuestionInline(admin.StackedInline):
    model = InterviewQuestion
    extra = 0
    readonly_fields = ('order', 'category', 'score', 'accuracy_score', 'clarity_score', 'depth_score', 'answered_at')


@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'role', 'target_company', 'difficulty', 'status', 'overall_score', 'hiring_verdict', 'started_at')
    list_filter = ('status', 'difficulty', 'role', 'started_at')
    search_fields = ('user__student_email', 'role', 'target_company')
    inlines = [InterviewQuestionInline]


@admin.register(InterviewQuestion)
class InterviewQuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'order', 'category', 'is_answered', 'score', 'created_at')
    list_filter = ('category', 'is_answered')
    search_fields = ('question_text', 'candidate_answer')
