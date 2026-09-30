from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class AccountManager(BaseUserManager):
    def create_user(self, student_email, student_name='', password=None, **extra_fields):
        if not student_email:
            raise ValueError("Email is required")

        student_email = self.normalize_email(student_email)

        user = self.model(
            student_email=student_email,
            student_name=student_name,
            **extra_fields
        )

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, student_email, student_name='', password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(
            student_email=student_email,
            student_name=student_name,
            password=password,
            **extra_fields
        )


from django.utils import timezone


class Account(AbstractBaseUser, PermissionsMixin):
    student_name = models.CharField(max_length=100, blank=True)
    student_email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = AccountManager()

    USERNAME_FIELD = 'student_email'
    REQUIRED_FIELDS = ['student_name']

    @property
    def email(self):
        return self.student_email

    @email.setter
    def email(self, value):
        self.student_email = value

    @property
    def student_password(self):
        return self.password

    def __str__(self):
        return self.student_email


import os
import uuid
import re


def user_resume_upload_path(instance, filename):
    """
    Stores each user's resumes in an isolated, secure directory:
    media/resumes/user_<id>/<unique_id>_<cleaned_filename>.pdf
    """
    clean_filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', os.path.basename(filename))
    if not clean_filename.lower().endswith('.pdf'):
        clean_filename += '.pdf'
    
    unique_suffix = uuid.uuid4().hex[:8]
    user_id = instance.user_id or (instance.user.id if getattr(instance, 'user', None) else 'unknown')
    return f'resumes/user_{user_id}/{unique_suffix}_{clean_filename}'


class Resume(models.Model):
    user = models.ForeignKey(
        'accounts.Account',
        on_delete=models.CASCADE,
        related_name='resumes'
    )
    file = models.FileField(upload_to=user_resume_upload_path)
    file_name = models.CharField(max_length=255, help_text="Original uploaded filename")
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(
        default=True,
        help_text="Designates this resume as the active resume for interview calibration"
    )

    # Full raw text extracted from PDF stored directly in PostgreSQL
    extracted_text = models.TextField(blank=True, default='', help_text="Raw full text extracted from the PDF resume")

    # Binary raw PDF data stored directly in PostgreSQL BYTEA column
    pdf_data = models.BinaryField(blank=True, null=True, help_text="Raw PDF binary file data stored directly in PostgreSQL")

    # Structured metadata extracted by AI parser
    extracted_education = models.JSONField(default=list, blank=True)
    extracted_skills = models.JSONField(default=list, blank=True)
    extracted_projects = models.JSONField(default=list, blank=True)
    extracted_experience = models.JSONField(default=list, blank=True)
    extracted_certifications = models.JSONField(default=list, blank=True)
    analysis_summary = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['user', '-uploaded_at']),
            models.Index(fields=['user', 'is_active']),
        ]

    def __str__(self):
        return f"{self.file_name} (User: {self.user.student_email})"

    @property
    def file_url(self):
        if self.file and hasattr(self.file, 'url'):
            return self.file.url
        return ''