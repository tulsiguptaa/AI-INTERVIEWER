from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from accounts.views import get_authenticated_user
from accounts.models import Resume
from .models import InterviewSession, InterviewQuestion
from .ai_engine import generate_interview_questions, evaluate_interview_answer


def serialize_question(q: InterviewQuestion, include_eval: bool = True) -> dict:
    """Serializes an InterviewQuestion model instance."""
    data = {
        'id': q.id,
        'order': q.order,
        'category': q.category,
        'question_text': q.question_text,
        'context_hint': q.context_hint,
        'key_criteria': q.key_criteria,
        'candidate_answer': q.candidate_answer,
        'is_answered': q.is_answered,
        'answered_at': q.answered_at.isoformat() if q.answered_at else None,
        'time_taken_seconds': q.time_taken_seconds,
    }
    if include_eval and q.is_answered:
        data.update({
            'score': q.score,
            'accuracy_score': q.accuracy_score,
            'clarity_score': q.clarity_score,
            'depth_score': q.depth_score,
            'rubric_feedback': q.rubric_feedback,
            'strengths': q.strengths,
            'gaps': q.gaps,
            'model_answer': q.model_answer,
            'follow_up_drill': q.follow_up_drill,
        })
    return data


def serialize_session(session: InterviewSession, include_all_questions: bool = False) -> dict:
    """Serializes an InterviewSession instance."""
    questions_qs = session.questions.all().order_by('order')
    total_q = session.total_questions
    answered_q = questions_qs.filter(is_answered=True).count()

    data = {
        'id': session.id,
        'title': session.title,
        'role': session.role,
        'target_company': session.target_company,
        'difficulty': session.difficulty,
        'mode': session.mode,
        'status': session.status,
        'total_questions': total_q,
        'answered_count': answered_q,
        'current_question_index': session.current_question_index,
        'overall_score': session.overall_score,
        'technical_score': session.technical_score,
        'communication_score': session.communication_score,
        'depth_score': session.depth_score,
        'structure_score': session.structure_score,
        'readiness_index': session.readiness_index,
        'hiring_verdict': session.hiring_verdict,
        'overall_feedback': session.overall_feedback,
        'key_strengths': session.key_strengths,
        'improvement_areas': session.improvement_areas,
        'started_at': session.started_at.isoformat() if session.started_at else None,
        'completed_at': session.completed_at.isoformat() if session.completed_at else None,
        'duration_seconds': session.duration_seconds,
        'resume_id': session.resume.id if session.resume else None,
        'resume_filename': session.resume.file_name if session.resume else None,
    }

    if include_all_questions:
        data['questions'] = [serialize_question(q, include_eval=True) for q in questions_qs]

    return data


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def sessions_view(request):
    """
    GET: List all interview sessions for the authenticated user.
    POST: Initialize a new tailored interview session.
    """
    user = get_authenticated_user(request)
    if not user:
        return Response(
            {'error': 'Authentication required to access interview modules.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if request.method == 'GET':
        sessions = InterviewSession.objects.filter(user=user).order_by('-started_at')
        return Response({
            'success': True,
            'count': sessions.count(),
            'sessions': [serialize_session(s, include_all_questions=False) for s in sessions]
        })

    # POST: Create new session
    data = request.data or {}
    role = data.get('role', 'Full-Stack Engineer')
    target_company = data.get('target_company', 'FAANG / Tier-1 Tech')
    difficulty = data.get('difficulty', 'medium')
    mode = data.get('mode', 'voice_and_text')
    total_questions = int(data.get('total_questions', 5))
    use_resume = data.get('use_resume', True)

    # Fetch active resume from PostgreSQL if requested
    active_resume = None
    resume_payload = None
    if use_resume:
        active_resume = Resume.objects.filter(user=user, is_active=True).first()
        if not active_resume:
            active_resume = Resume.objects.filter(user=user).order_by('-uploaded_at').first()

        if active_resume:
            resume_payload = {
                'skills': active_resume.extracted_skills or [],
                'projects': active_resume.extracted_projects or [],
                'experience': active_resume.extracted_experience or [],
                'education': active_resume.extracted_education or [],
            }

    # Generate custom questions using AI Engine
    generated_q_list = generate_interview_questions(
        role=role,
        target_company=target_company,
        difficulty=difficulty,
        resume_data=resume_payload,
        count=total_questions
    )

    title = f"{role} ({target_company}) - {difficulty.capitalize()}"

    session = InterviewSession.objects.create(
        user=user,
        resume=active_resume,
        title=title,
        role=role,
        target_company=target_company,
        difficulty=difficulty,
        mode=mode,
        status='in_progress',
        total_questions=len(generated_q_list),
        current_question_index=0
    )

    # Persist question instances
    created_questions = []
    for idx, q_data in enumerate(generated_q_list, start=1):
        q_obj = InterviewQuestion.objects.create(
            session=session,
            order=idx,
            category=q_data.get('category', 'Technical Problem Solving'),
            question_text=q_data.get('question_text', ''),
            context_hint=q_data.get('context_hint', ''),
            key_criteria=q_data.get('key_criteria', []),
            model_answer=q_data.get('model_answer', ''),
            follow_up_drill=q_data.get('follow_up_drill', '')
        )
        created_questions.append(q_obj)

    first_q = created_questions[0] if created_questions else None

    return Response({
        'success': True,
        'message': 'Interview session successfully initialized.',
        'session': serialize_session(session, include_all_questions=True),
        'current_question': serialize_question(first_q, include_eval=False) if first_q else None
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def session_detail_view(request, session_id):
    """Retrieves an interview session along with all questions and evaluations."""
    user = get_authenticated_user(request)
    if not user:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        session = InterviewSession.objects.get(id=session_id, user=user)
    except InterviewSession.DoesNotExist:
        return Response({'error': 'Interview session not found.'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'success': True,
        'session': serialize_session(session, include_all_questions=True)
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def submit_answer_view(request, session_id):
    """
    Submits a candidate's answer for a question, immediately invokes AI evaluation,
    updates rubric metrics, and returns the evaluation + next question.
    """
    user = get_authenticated_user(request)
    if not user:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        session = InterviewSession.objects.get(id=session_id, user=user)
    except InterviewSession.DoesNotExist:
        return Response({'error': 'Interview session not found.'}, status=status.HTTP_404_NOT_FOUND)

    data = request.data or {}
    question_id = data.get('question_id')
    candidate_answer = data.get('candidate_answer', '').strip()
    time_taken_seconds = int(data.get('time_taken_seconds', 0))

    try:
        question = InterviewQuestion.objects.get(id=question_id, session=session)
    except InterviewQuestion.DoesNotExist:
        return Response({'error': 'Question not found in this session.'}, status=status.HTTP_404_NOT_FOUND)

    # Perform AI Evaluation
    eval_result = evaluate_interview_answer(
        question_data={
            'question_text': question.question_text,
            'key_criteria': question.key_criteria,
            'model_answer': question.model_answer,
            'follow_up_drill': question.follow_up_drill,
            'category': question.category
        },
        candidate_answer=candidate_answer,
        role=session.role,
        difficulty=session.difficulty
    )

    # Update question record
    question.candidate_answer = candidate_answer
    question.is_answered = True
    question.answered_at = timezone.now()
    question.time_taken_seconds = time_taken_seconds
    question.score = eval_result['score']
    question.accuracy_score = eval_result['accuracy_score']
    question.clarity_score = eval_result['clarity_score']
    question.depth_score = eval_result['depth_score']
    question.rubric_feedback = eval_result['rubric_feedback']
    question.strengths = eval_result['strengths']
    question.gaps = eval_result['gaps']
    if eval_result.get('model_answer'):
        question.model_answer = eval_result['model_answer']
    if eval_result.get('follow_up_drill'):
        question.follow_up_drill = eval_result['follow_up_drill']
    question.save()

    # Advance current question index if applicable
    all_questions = list(session.questions.all().order_by('order'))
    answered_count = sum(1 for q in all_questions if q.is_answered)
    is_completed = (answered_count >= len(all_questions))

    # Find next question
    next_question = None
    for q in all_questions:
        if not q.is_answered:
            next_question = q
            break

    if is_completed:
        session.status = 'completed'
        session.completed_at = timezone.now()
        session.calculate_aggregates()
        session.save()
    else:
        if next_question:
            session.current_question_index = next_question.order - 1
            session.save()

    return Response({
        'success': True,
        'evaluation': {
            'score': question.score,
            'accuracy_score': question.accuracy_score,
            'clarity_score': question.clarity_score,
            'depth_score': question.depth_score,
            'rubric_feedback': question.rubric_feedback,
            'strengths': question.strengths,
            'gaps': question.gaps,
            'model_answer': question.model_answer,
            'follow_up_drill': question.follow_up_drill,
        },
        'is_completed': is_completed,
        'next_question': serialize_question(next_question, include_eval=False) if next_question else None,
        'session': serialize_session(session, include_all_questions=True)
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def finish_session_view(request, session_id):
    """Concludes the interview session, calculates comprehensive feedback scorecard."""
    user = get_authenticated_user(request)
    if not user:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        session = InterviewSession.objects.get(id=session_id, user=user)
    except InterviewSession.DoesNotExist:
        return Response({'error': 'Interview session not found.'}, status=status.HTTP_404_NOT_FOUND)

    session.status = 'completed'
    session.completed_at = timezone.now()
    session.calculate_aggregates()

    # Synthesize holistic strengths and improvement areas
    questions = session.questions.filter(is_answered=True)
    all_strengths = []
    all_gaps = []
    for q in questions:
        all_strengths.extend(q.strengths or [])
        all_gaps.extend(q.gaps or [])

    session.key_strengths = list(dict.fromkeys(all_strengths))[:5]
    session.improvement_areas = list(dict.fromkeys(all_gaps))[:5]

    score = session.overall_score
    if score >= 85:
        session.overall_feedback = (
            f"Outstanding performance across {questions.count()} technical competencies. "
            f"You demonstrated deep architectural maturity, precise engineering vocabulary, "
            f"and structured reasoning aligned with Tier-1 Staff/Senior standards."
        )
    elif score >= 70:
        session.overall_feedback = (
            f"Solid technical interview performance ({score}/100). You articulated core principles well "
            f"and showed strong problem-solving capabilities. Focus on quantifying system trade-offs "
            f"and edge-case fault tolerance to reach the top tier."
        )
    else:
        session.overall_feedback = (
            f"Good effort on foundational questions. To pass Tier-1 technical screens, work on "
            f"system design terminology, structured STAR formatting for behavioral questions, and explicit time/space trade-offs."
        )

    session.save()

    return Response({
        'success': True,
        'message': 'Interview concluded successfully.',
        'session': serialize_session(session, include_all_questions=True)
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def analytics_overview_view(request):
    """Provides aggregated interview readiness statistics and history for the student dashboard."""
    user = get_authenticated_user(request)
    if not user:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    sessions = InterviewSession.objects.filter(user=user)
    completed_sessions = sessions.filter(status='completed')

    total_sessions = sessions.count()
    completed_count = completed_sessions.count()

    if completed_count > 0:
        avg_score = round(sum(s.overall_score for s in completed_sessions) / completed_count, 1)
        avg_tech = round(sum(s.technical_score for s in completed_sessions) / completed_count, 1)
        avg_comm = round(sum(s.communication_score for s in completed_sessions) / completed_count, 1)
        avg_depth = round(sum(s.depth_score for s in completed_sessions) / completed_count, 1)
        readiness_index = int(sum(s.readiness_index for s in completed_sessions) / completed_count)
    else:
        avg_score = 0.0
        avg_tech = 0.0
        avg_comm = 0.0
        avg_depth = 0.0
        readiness_index = 0

    recent_sessions = [serialize_session(s, include_all_questions=False) for s in sessions.order_by('-started_at')[:6]]

    return Response({
        'success': True,
        'analytics': {
            'total_sessions': total_sessions,
            'completed_count': completed_count,
            'average_score': avg_score,
            'technical_score': avg_tech,
            'communication_score': avg_comm,
            'depth_score': avg_depth,
            'readiness_index': readiness_index,
            'recent_sessions': recent_sessions,
        }
    })
