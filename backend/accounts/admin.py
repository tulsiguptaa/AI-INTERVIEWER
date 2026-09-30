from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.admin.forms import AdminAuthenticationForm
from .models import Account


class EmailAdminAuthenticationForm(AdminAuthenticationForm):
    username = forms.EmailField(
        label="Email",
        widget=forms.EmailInput(attrs={"autofocus": True, "placeholder": "admin@example.com"})
    )


# Configure admin site login form to use email
admin.site.login_form = EmailAdminAuthenticationForm
admin.site.site_header = "AI Interviewer Admin Portal"
admin.site.site_title = "AI Interviewer Admin"
admin.site.index_title = "Candidate & System Administration"


@admin.register(Account)
class AccountAdmin(UserAdmin):
    list_display = ('student_email', 'student_name', 'is_staff', 'is_superuser', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active')
    search_fields = ('student_email', 'student_name')
    ordering = ('student_email',)

    fieldsets = (
        (None, {'fields': ('student_email', 'password')}),
        ('Personal Info', {'fields': ('student_name',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('student_email', 'student_name', 'password'),
        }),
    )


from .models import Resume


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'file_name',
        'user_email',
        'file_size',
        'uploaded_at',
        'is_active',
        'skills_count',
        'has_extracted_text',
        'has_postgres_blob',
    )
    list_filter = ('is_active', 'uploaded_at')
    search_fields = ('file_name', 'user__student_email', 'user__student_name', 'extracted_text')
    readonly_fields = ('uploaded_at', 'updated_at', 'file_size', 'extracted_text')

    def user_email(self, obj):
        return obj.user.student_email
    user_email.short_description = 'Student Email'

    def skills_count(self, obj):
        return len(obj.extracted_skills) if obj.extracted_skills else 0
    skills_count.short_description = 'Detected Skills'

    def has_extracted_text(self, obj):
        return bool(obj.extracted_text)
    has_extracted_text.boolean = True
    has_extracted_text.short_description = 'Extracted Text Stored'

    def has_postgres_blob(self, obj):
        return bool(obj.pdf_data)
    has_postgres_blob.boolean = True
    has_postgres_blob.short_description = 'PDF Stored in Postgres'

