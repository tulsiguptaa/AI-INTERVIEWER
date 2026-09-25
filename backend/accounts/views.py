from django.contrib.auth import authenticate, login
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Account


@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    data = request.data
    student_name = data.get('student_name', '').strip()
    student_email = data.get('student_email', '').strip().lower()
    student_password = data.get('student_password', '')

    if not student_name or not student_email or not student_password:
        return Response(
            {'success': False, 'error': 'All fields (Full Name, Email, Password) are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(student_password) < 6:
        return Response(
            {'success': False, 'error': 'Password must be at least 6 characters long.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if Account.objects.filter(student_email=student_email).exists():
        return Response(
            {'success': False, 'error': 'An account with this email already exists.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        account = Account.objects.create_user(
            student_email=student_email,
            student_name=student_name,
            password=student_password
        )
    except Exception as e:
        return Response(
            {'success': False, 'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Establish session
    login(request, account, backend='django.contrib.auth.backends.ModelBackend')

    return Response(
        {
            'success': True,
            'message': 'Account created successfully!',
            'user': {
                'id': account.id,
                'student_name': account.student_name,
                'student_email': account.student_email
            }
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    data = request.data
    student_email = data.get('student_email', '').strip().lower()
    student_password = data.get('student_password', '')

    if not student_email or not student_password:
        return Response(
            {'success': False, 'error': 'Please enter both email and password.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        account = Account.objects.get(student_email=student_email)
    except Account.DoesNotExist:
        return Response(
            {'success': False, 'error': 'Invalid email or password.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not account.check_password(student_password):
        return Response(
            {'success': False, 'error': 'Invalid email or password.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Establish session
    login(request, account, backend='django.contrib.auth.backends.ModelBackend')

    return Response(
        {
            'success': True,
            'message': 'Login successful!',
            'user': {
                'id': account.id,
                'student_name': account.student_name,
                'student_email': account.student_email
            }
        },
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def current_user_view(request):
    """
    Returns current authenticated student user (supports both session and social login).
    """
    if request.user.is_authenticated:
        return Response({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'student_name': getattr(request.user, 'student_name', '') or request.user.email,
                'student_email': getattr(request.user, 'student_email', request.user.email),
                'is_staff': request.user.is_staff,
            }
        })
    return Response({'authenticated': False, 'user': None})


@api_view(['GET'])
@permission_classes([AllowAny])
def google_auth_status_view(request):
    """
    Returns whether Google OAuth credentials are loaded and configured.
    Dynamically re-reads .env so changes are reflected immediately.
    """
    import os
    from django.conf import settings
    from dotenv import load_dotenv

    base_dir = getattr(settings, 'BASE_DIR', None)
    if base_dir:
        load_dotenv(base_dir.parent / '.env', override=True)
        load_dotenv(base_dir / '.env', override=True)

    client_id = (os.environ.get('GOOGLE_CLIENT_ID') or getattr(settings, 'GOOGLE_CLIENT_ID', '')).strip().strip('"').strip("'")
    client_secret = (os.environ.get('GOOGLE_CLIENT_SECRET') or getattr(settings, 'GOOGLE_CLIENT_SECRET', '')).strip().strip('"').strip("'")

    if client_id and 'google' in settings.SOCIALACCOUNT_PROVIDERS:
        settings.GOOGLE_CLIENT_ID = client_id
        settings.GOOGLE_CLIENT_SECRET = client_secret
        settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['client_id'] = client_id
        settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['secret'] = client_secret

    is_configured = bool(client_id and client_secret)
    return Response({
        'configured': is_configured,
        'client_id_present': bool(client_id),
        'client_secret_present': bool(client_secret),
        'client_id_preview': f"{client_id[:8]}...{client_id[-10:]}" if len(client_id) > 18 else (client_id if client_id else None)
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def github_auth_status_view(request):
    """
    Returns whether GitHub OAuth credentials are loaded and configured.
    Dynamically re-reads .env so changes are reflected immediately.
    """
    import os
    from django.conf import settings
    from dotenv import load_dotenv

    base_dir = getattr(settings, 'BASE_DIR', None)
    if base_dir:
        load_dotenv(base_dir.parent / '.env', override=True)
        load_dotenv(base_dir / '.env', override=True)

    client_id = (os.environ.get('GITHUB_CLIENT_ID') or getattr(settings, 'GITHUB_CLIENT_ID', '')).strip().strip('"').strip("'")
    client_secret = (os.environ.get('GITHUB_CLIENT_SECRET') or getattr(settings, 'GITHUB_CLIENT_SECRET', '')).strip().strip('"').strip("'")

    if client_id and 'github' in settings.SOCIALACCOUNT_PROVIDERS:
        settings.GITHUB_CLIENT_ID = client_id
        settings.GITHUB_CLIENT_SECRET = client_secret
        settings.SOCIALACCOUNT_PROVIDERS['github']['APP']['client_id'] = client_id
        settings.SOCIALACCOUNT_PROVIDERS['github']['APP']['secret'] = client_secret

    is_configured = bool(client_id and client_secret)
    return Response({
        'configured': is_configured,
        'client_id_present': bool(client_id),
        'client_secret_present': bool(client_secret),
        'client_id_preview': f"{client_id[:6]}...{client_id[-4:]}" if len(client_id) > 10 else (client_id if client_id else None)
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """
    Terminates the user's Django session.
    """
    from django.contrib.auth import logout
    logout(request)
    return Response({'success': True, 'message': 'Logged out successfully.'})