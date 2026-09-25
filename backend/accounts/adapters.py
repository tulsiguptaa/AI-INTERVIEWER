import os
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings
from dotenv import load_dotenv


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def get_app(self, request, provider, client_id=None):
        base_dir = getattr(settings, 'BASE_DIR', None)
        if base_dir:
            load_dotenv(base_dir.parent / '.env', override=True)
            load_dotenv(base_dir / '.env', override=True)

        if provider == 'google':
            c_id = (os.environ.get('GOOGLE_CLIENT_ID') or getattr(settings, 'GOOGLE_CLIENT_ID', '')).strip().strip('"').strip("'")
            c_secret = (os.environ.get('GOOGLE_CLIENT_SECRET') or getattr(settings, 'GOOGLE_CLIENT_SECRET', '')).strip().strip('"').strip("'")
            if c_id and 'google' in settings.SOCIALACCOUNT_PROVIDERS:
                settings.GOOGLE_CLIENT_ID = c_id
                settings.GOOGLE_CLIENT_SECRET = c_secret
                settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['client_id'] = c_id
                settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['secret'] = c_secret

        if provider == 'github':
            gh_id = (os.environ.get('GITHUB_CLIENT_ID') or getattr(settings, 'GITHUB_CLIENT_ID', '')).strip().strip('"').strip("'")
            gh_secret = (os.environ.get('GITHUB_CLIENT_SECRET') or getattr(settings, 'GITHUB_CLIENT_SECRET', '')).strip().strip('"').strip("'")
            if gh_id and 'github' in settings.SOCIALACCOUNT_PROVIDERS:
                settings.GITHUB_CLIENT_ID = gh_id
                settings.GITHUB_CLIENT_SECRET = gh_secret
                settings.SOCIALACCOUNT_PROVIDERS['github']['APP']['client_id'] = gh_id
                settings.SOCIALACCOUNT_PROVIDERS['github']['APP']['secret'] = gh_secret

        return super().get_app(request, provider, client_id)

    def pre_social_login(self, request, sociallogin):
        # If sociallogin already connects to an existing user, return
        if sociallogin.is_existing:
            return

        # Extract email from sociallogin or extra_data
        email = (
            getattr(sociallogin.user, 'student_email', None)
            or getattr(sociallogin.user, 'email', None)
            or (sociallogin.account.extra_data.get('email') if sociallogin.account else None)
        )
        if not email and hasattr(sociallogin, 'email_addresses') and sociallogin.email_addresses:
            for ea in sociallogin.email_addresses:
                if ea.email:
                    email = ea.email
                    break

        if email:
            from accounts.models import Account
            try:
                existing_user = Account.objects.get(student_email__iexact=email.strip().lower())
                sociallogin.connect(request, existing_user)
            except Account.DoesNotExist:
                pass

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)

        name = (
            data.get('name')
            or f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
            or (sociallogin.account.extra_data.get('name') if sociallogin.account else None)
            or (sociallogin.account.extra_data.get('login') if sociallogin.account else None)
        )
        if name and not getattr(user, 'student_name', None):
            user.student_name = name

        email = data.get('email')
        if not email and sociallogin.account:
            email = sociallogin.account.extra_data.get('email')
        if not email and hasattr(sociallogin, 'email_addresses') and sociallogin.email_addresses:
            for ea in sociallogin.email_addresses:
                if ea.email:
                    email = ea.email
                    break
        if not email and sociallogin.account and sociallogin.account.provider == 'github':
            # Fallback if user has private email on GitHub
            login_username = sociallogin.account.extra_data.get('login')
            if login_username:
                email = f"{login_username}@users.noreply.github.com"

        if email and not getattr(user, 'student_email', None):
            user.student_email = email.lower().strip()

        return user
