from django.db import models
from django.conf import settings
from django.utils import timezone


class InterviewSession(models.Model):
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]

    DIFFICULTY_CHOICES = [
        ('easy', 'Junior / Entry Level'),
        ('medium', 'Mid-Level Specialist'),
        ('hard', 'Senior / Lead'),
        ('expert', 'Staff / Principal Architect'),
    ]

    MODE_CHOICES = [
        ('voice_and_text', 'Voice & Text Hybrid'),
        ('text_only', 'Text Only'),
        ('voice_first', 'Voice First'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='interview_sessions'
    )
    resume = models.ForeignKey(
        'accounts.Resume',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='interview_sessions'
    )
    title = models.CharField(max_length=255, default='AI Technical Mock Interview')
    role = models.CharField(max_length=100, default='Full-Stack Engineer')
    target_company = models.CharField(max_length=100, default='FAANG / Tier-1 Tech')
    difficulty = models.CharField(max_length=50, default='medium', choices=DIFFICULTY_CHOICES)
    mode = models.CharField(max_length=50, default='voice_and_text', choices=MODE_CHOICES)
    status = models.CharField(max_length=50, default='in_progress', choices=STATUS_CHOICES)

    total_questions = models.PositiveIntegerField(default=5)
    current_question_index = models.PositiveIntegerField(default=0)

    # Aggregate AI Metrics
    overall_score = models.FloatField(default=0.0)  # 0.0 to 100.0
    technical_score = models.FloatField(default=0.0)
    communication_score = models.FloatField(default=0.0)
    depth_score = models.FloatField(default=0.0)
    structure_score = models.FloatField(default=0.0)
    readiness_index = models.IntegerField(default=0)  # 0 to 100%

    hiring_verdict = models.CharField(
        max_length=100,
        default='Pending Evaluation',
        help_text='Strong Hire, Lean Hire, Inconclusive, Needs Improvement'
    )
    overall_feedback = models.TextField(blank=True, default='')
    key_strengths = models.JSONField(default=list, blank=True)
    improvement_areas = models.JSONField(default=list, blank=True)

    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', '-started_at']),
            models.Index(fields=['user', 'status']),
        ]

    def __str__(self):
        return f"{self.title} - {self.user.student_email} ({self.status})"

    def calculate_aggregates(self):
        """Calculates final scores and hiring verdict across all evaluated questions."""
        evaluated_questions = self.questions.filter(is_answered=True)
        if not evaluated_questions.exists():
            return

        count = evaluated_questions.count()
        avg_score = sum(q.score for q in evaluated_questions) / count
        avg_acc = sum(q.accuracy_score for q in evaluated_questions) / count
        avg_comm = sum(q.clarity_score for q in evaluated_questions) / count
        avg_depth = sum(q.depth_score for q in evaluated_questions) / count

        self.overall_score = round(avg_score, 1)
        self.technical_score = round(avg_acc, 1)
        self.communication_score = round(avg_comm, 1)
        self.depth_score = round(avg_depth, 1)
        self.structure_score = round((avg_acc * 0.4 + avg_comm * 0.3 + avg_depth * 0.3), 1)

        # Readiness percentage
        self.readiness_index = int(min(100, max(10, avg_score * 0.95 + 5)))

        if avg_score >= 85:
            self.hiring_verdict = 'Strong Hire (L5/L6 Bar Passed)'
        elif avg_score >= 70:
            self.hiring_verdict = 'Lean Hire (Competitive Candidate)'
        elif avg_score >= 55:
            self.hiring_verdict = 'Mixed Evaluation (Targeted Polish Required)'
        else:
            self.hiring_verdict = 'Needs Significant Preparation'


class InterviewQuestion(models.Model):
    session = models.ForeignKey(
        InterviewSession,
        on_delete=models.CASCADE,
        related_name='questions'
    )
    order = models.PositiveIntegerField(default=1)
    category = models.CharField(
        max_length=100,
        default='System Architecture & Engineering',
        help_text='System Design, Data Structures & Logic, Behavioral STAR, Resume Deep-Dive, Framework Internals'
    )
    question_text = models.TextField()
    context_hint = models.TextField(blank=True, default='')
    key_criteria = models.JSONField(default=list, blank=True)

    # Candidate Submission
    candidate_answer = models.TextField(blank=True, default='')
    is_answered = models.BooleanField(default=False)
    answered_at = models.DateTimeField(null=True, blank=True)
    time_taken_seconds = models.PositiveIntegerField(default=0)

    # AI Evaluation and Rubric Scores
    score = models.FloatField(default=0.0)  # 0 to 100
    accuracy_score = models.FloatField(default=0.0)  # 0 to 100
    clarity_score = models.FloatField(default=0.0)  # 0 to 100
    depth_score = models.FloatField(default=0.0)  # 0 to 100

    rubric_feedback = models.TextField(blank=True, default='')
    strengths = models.JSONField(default=list, blank=True)
    gaps = models.JSONField(default=list, blank=True)
    model_answer = models.TextField(blank=True, default='')
    follow_up_drill = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']
        unique_together = ('session', 'order')

    def __str__(self):
        return f"Q{self.order}: {self.category} ({self.session.title})"
