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

        c_id = (os.environ.get('GOOGLE_CLIENT_ID') or getattr(settings, 'GOOGLE_CLIENT_ID', '')).strip().strip('"').strip("'")
        c_secret = (os.environ.get('GOOGLE_CLIENT_SECRET') or getattr(settings, 'GOOGLE_CLIENT_SECRET', '')).strip().strip('"').strip("'")

        if c_id and provider == 'google':
            settings.GOOGLE_CLIENT_ID = c_id
            settings.GOOGLE_CLIENT_SECRET = c_secret
            if 'google' in settings.SOCIALACCOUNT_PROVIDERS:
                settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['client_id'] = c_id
                settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['secret'] = c_secret

        return super().get_app(request, provider, client_id)

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)

        name = data.get('name') or f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
        if name and not getattr(user, 'student_name', None):
            user.student_name = name

        email = data.get('email')
        if email and not getattr(user, 'student_email', None):
            user.student_email = email.lower()

        return user
