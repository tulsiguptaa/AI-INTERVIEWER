from django.contrib.auth import authenticate, login, logout
from django.contrib.sessions.models import Session
from django.utils import timezone
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import os
from .models import Account, Resume
from .resume_parser import extract_text_from_pdf, analyze_resume_text


def get_authenticated_user(request):
    """
    Robustly resolves the authenticated student user using:
    1. Standard Django session (request.user.is_authenticated)
    2. Session key in X-Session-Key or Authorization: Bearer <session_key>
    3. User email or ID fallback from request headers or data
    """
    if request.user and request.user.is_authenticated:
        return request.user

    # 2. Check X-Session-Key or Authorization: Bearer <session_key>
    session_key = request.headers.get('X-Session-Key', '').strip()
    if not session_key:
        auth_header = request.headers.get('Authorization', '').strip()
        if auth_header.startswith('Bearer '):
            session_key = auth_header.split(' ', 1)[1].strip()

    if session_key:
        try:
            session = Session.objects.filter(session_key=session_key, expire_date__gt=timezone.now()).first()
            if session:
                data = session.get_decoded()
                user_id = data.get('_auth_user_id')
                if user_id:
                    user = Account.objects.filter(id=user_id, is_active=True).first()
                    if user:
                        return user
        except Exception as ex:
            print(f"[AuthHelper] Session lookup error: {ex}")

    # 3. Check X-User-Email header or user_email in data/query
    user_email = (
        request.headers.get('X-User-Email')
        or (request.data.get('user_email') if hasattr(request, 'data') else None)
        or request.GET.get('user_email')
    )
    if user_email and isinstance(user_email, str):
        user = Account.objects.filter(student_email__iexact=user_email.strip(), is_active=True).first()
        if user:
            return user

    # 4. Check X-User-Id header or user_id in data/query
    user_id = (
        request.headers.get('X-User-Id')
        or (request.data.get('user_id') if hasattr(request, 'data') else None)
        or request.GET.get('user_id')
    )
    if user_id:
        try:
            user = Account.objects.filter(id=int(user_id), is_active=True).first()
            if user:
                return user
        except (ValueError, TypeError):
            pass

    return None


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
    if not request.session.session_key:
        request.session.save()
    session_key = request.session.session_key or ''

    return Response(
        {
            'success': True,
            'message': 'Account created successfully!',
            'session_key': session_key,
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
    if not request.session.session_key:
        request.session.save()
    session_key = request.session.session_key or ''

    return Response(
        {
            'success': True,
            'message': 'Login successful!',
            'session_key': session_key,
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
    Returns current authenticated student user (supports session, token, and social login).
    """
    user = get_authenticated_user(request)
    if user:
        if not request.session.session_key:
            request.session.save()
        return Response({
            'authenticated': True,
            'session_key': request.session.session_key or '',
            'user': {
                'id': user.id,
                'student_name': getattr(user, 'student_name', '') or user.email,
                'student_email': getattr(user, 'student_email', user.email),
                'is_staff': user.is_staff,
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


@api_view(['POST'])
@permission_classes([AllowAny])
def resume_upload_view(request):
    """
    Uploads, parses, and stores a PDF resume for the authenticated user directly in PostgreSQL,
    including the raw PDF binary bytes and full extracted text.
    """
    user = get_authenticated_user(request)
    if not user:
        return Response(
            {
                'success': False,
                'error': 'Authentication required. Please sign in to save your resume to your account.'
            },
            status=status.HTTP_401_UNAUTHORIZED
        )

    file_obj = request.FILES.get('file') or request.FILES.get('resume')
    if not file_obj:
        return Response(
            {'success': False, 'error': 'No file provided. Please attach a resume PDF.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 1. Filename validation
    if not file_obj.name.lower().endswith('.pdf'):
        return Response(
            {'success': False, 'error': 'Unsupported file format. Please upload a PDF file (.pdf).'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 2. File size validation (10 MB)
    max_size = 10 * 1024 * 1024
    if file_obj.size > max_size:
        return Response(
            {'success': False, 'error': 'File size exceeds the 10 MB maximum limit.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 3. PDF Header / Magic Byte validation
    try:
        header = file_obj.read(5)
        file_obj.seek(0)
        if header != b'%PDF-':
            return Response(
                {'success': False, 'error': 'Invalid or corrupted PDF file.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception:
        return Response(
            {'success': False, 'error': 'Could not read uploaded file.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 4. Extract text and analyze content
    extracted_text = extract_text_from_pdf(file_obj)
    analysis = analyze_resume_text(extracted_text)

    # Read binary bytes of the PDF to store directly in PostgreSQL BYTEA column
    try:
        file_obj.seek(0)
        pdf_bytes = file_obj.read()
        file_obj.seek(0)
    except Exception as read_err:
        print(f"[ResumeUpload] Warning reading binary bytes: {read_err}")
        pdf_bytes = None

    # 5. Mark previous user resumes as inactive
    Resume.objects.filter(user=user, is_active=True).update(is_active=False)

    # 6. Save Resume model instance in PostgreSQL
    try:
        resume = Resume.objects.create(
            user=user,
            file=file_obj,
            pdf_data=pdf_bytes,
            extracted_text=extracted_text,
            file_name=file_obj.name,
            file_size=file_obj.size,
            is_active=True,
            extracted_education=analysis.get('education', []),
            extracted_skills=analysis.get('skills', []),
            extracted_projects=analysis.get('projects', []),
            extracted_experience=analysis.get('experience', []),
            extracted_certifications=analysis.get('certifications', []),
            analysis_summary=analysis.get('summary', '')
        )
    except Exception as e:
        return Response(
            {'success': False, 'error': f'Failed to store resume in PostgreSQL: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response(
        {
            'success': True,
            'message': 'Resume uploaded, extracted, and stored in PostgreSQL successfully.',
            'resume': {
                'id': resume.id,
                'file_name': resume.file_name,
                'file_size': resume.file_size,
                'file_url': resume.file_url,
                'uploaded_at': resume.uploaded_at.isoformat(),
                'is_active': resume.is_active,
                'extracted_text': resume.extracted_text,
                'has_binary_data': bool(resume.pdf_data),
                'analysis': {
                    'education': resume.extracted_education,
                    'skills': resume.extracted_skills,
                    'projects': resume.extracted_projects,
                    'experience': resume.extracted_experience,
                    'certifications': resume.extracted_certifications,
                    'summary': resume.analysis_summary
                }
            }
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def resume_list_view(request):
    """
    Returns all resumes uploaded by the authenticated user from PostgreSQL.
    """
    user = get_authenticated_user(request)
    if not user:
        return Response(
            {'success': False, 'error': 'Authentication required.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    resumes = Resume.objects.filter(user=user).order_by('-uploaded_at')
    data = []
    for r in resumes:
        data.append({
            'id': r.id,
            'file_name': r.file_name,
            'file_size': r.file_size,
            'file_url': r.file_url,
            'uploaded_at': r.uploaded_at.isoformat(),
            'is_active': r.is_active,
            'skills_count': len(r.extracted_skills) if r.extracted_skills else 0,
            'extracted_text_preview': (r.extracted_text[:250] + '...') if len(r.extracted_text) > 250 else r.extracted_text,
            'has_binary_data': bool(r.pdf_data),
            'summary': r.analysis_summary
        })

    return Response({'success': True, 'count': len(data), 'resumes': data})


@api_view(['GET'])
@permission_classes([AllowAny])
def latest_resume_view(request):
    """
    Returns the latest/active resume and extracted text/analysis for the authenticated user from PostgreSQL.
    """
    user = get_authenticated_user(request)
    if not user:
        return Response(
            {'success': False, 'error': 'Authentication required.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    resume = Resume.objects.filter(user=user, is_active=True).first()
    if not resume:
        resume = Resume.objects.filter(user=user).order_by('-uploaded_at').first()

    if not resume:
        return Response({'success': True, 'resume': None})

    return Response({
        'success': True,
        'resume': {
            'id': resume.id,
            'file_name': resume.file_name,
            'file_size': resume.file_size,
            'file_url': resume.file_url,
            'uploaded_at': resume.uploaded_at.isoformat(),
            'is_active': resume.is_active,
            'extracted_text': resume.extracted_text,
            'has_binary_data': bool(resume.pdf_data),
            'analysis': {
                'education': resume.extracted_education,
                'skills': resume.extracted_skills,
                'projects': resume.extracted_projects,
                'experience': resume.extracted_experience,
                'certifications': resume.extracted_certifications,
                'summary': resume.analysis_summary
            }
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def resume_download_view(request, resume_id):
    """
    Streams the raw PDF resume directly from PostgreSQL BYTEA column (or disk fallback).
    """
    user = get_authenticated_user(request)
    if not user:
        return Response({'success': False, 'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        resume = Resume.objects.get(id=resume_id, user=user)
    except Resume.DoesNotExist:
        return Response({'success': False, 'error': 'Resume not found.'}, status=status.HTTP_404_NOT_FOUND)

    if resume.pdf_data:
        response = HttpResponse(bytes(resume.pdf_data), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{resume.file_name}"'
        return response
    elif resume.file and os.path.isfile(resume.file.path):
        with open(resume.file.path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="{resume.file_name}"'
            return response

    return Response({'success': False, 'error': 'Resume file content not available.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def resume_delete_view(request, resume_id):
    """
    Deletes a user's resume from PostgreSQL database and removes any disk file.
    """
    user = get_authenticated_user(request)
    if not user:
        return Response(
            {'success': False, 'error': 'Authentication required.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        resume = Resume.objects.get(id=resume_id, user=user)
    except Resume.DoesNotExist:
        return Response(
            {'success': False, 'error': 'Resume not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Delete storage file if exists
    try:
        if resume.file and os.path.isfile(resume.file.path):
            os.remove(resume.file.path)
    except Exception as e:
        print(f"[ResumeDelete] Error removing file: {e}")

    resume.delete()
    return Response({'success': True, 'message': 'Resume deleted successfully from PostgreSQL.'})