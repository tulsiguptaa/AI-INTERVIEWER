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
