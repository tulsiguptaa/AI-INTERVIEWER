from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from accounts.models import Account, Resume
from interviews.models import InterviewSession, InterviewQuestion


class InterviewModuleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = Account.objects.create_user(
            student_email='candidate@example.com',
            student_name='Alice Engineer',
            password='testpassword123'
        )
        self.client.force_authenticate(user=self.user)

        # Create a mock resume in database
        self.resume = Resume.objects.create(
            user=self.user,
            file_name='Alice_Resume_2026.pdf',
            file_size=20480,
            extracted_text='Alice Engineer. Experienced with React, Python, PostgreSQL, and Distributed Caching.',
            extracted_skills=['React', 'Python', 'PostgreSQL', 'Docker', 'Redis'],
            extracted_projects=['High-Throughput E-Commerce Gateway', 'Realtime Analytics Engine'],
            extracted_experience=['Senior Full-Stack Engineer at TechCorp'],
            extracted_education=['B.S. in Computer Science'],
            analysis_summary='Strong full-stack profile with backend focus'
        )

    def test_create_interview_session(self):
        """Tests initializing an interview session calibrated with user resume."""
        response = self.client.post(
            reverse('interview_sessions'),
            {
                'role': 'Full-Stack Engineer',
                'target_company': 'Google / Tier-1 Tech',
                'difficulty': 'hard',
                'total_questions': 3,
                'use_resume': True
            },
            format='json'
        )

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('session', data)
        self.assertIn('current_question', data)

        session_id = data['session']['id']
        session = InterviewSession.objects.get(id=session_id)
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.resume, self.resume)
        self.assertEqual(session.total_questions, 3)
        self.assertEqual(session.questions.count(), 3)

    def test_submit_answer_and_evaluate(self):
        """Tests candidate answer submission, AI rubric scoring, and feedback."""
        create_resp = self.client.post(
            reverse('interview_sessions'),
            {
                'role': 'Backend Python / Django',
                'difficulty': 'medium',
                'total_questions': 2,
                'use_resume': False
            },
            format='json'
        )
        session_id = create_resp.json()['session']['id']
        question_id = create_resp.json()['current_question']['id']

        # Submit detailed technical answer
        candidate_answer = (
            "In Python, the Global Interpreter Lock (GIL) serializes thread execution for bytecode to safeguard reference counts. "
            "For I/O-bound workloads, threads release the GIL during network and file calls, making asyncio or threading very fast. "
            "For CPU-bound processing, we use multiprocessing to spawn separate processes with independent GILs, or offload tasks "
            "asynchronously using Celery workers backed by Redis."
        )

        submit_resp = self.client.post(
            reverse('interview_submit_answer', kwargs={'session_id': session_id}),
            {
                'question_id': question_id,
                'candidate_answer': candidate_answer,
                'time_taken_seconds': 45
            },
            format='json'
        )

        self.assertEqual(submit_resp.status_code, 200)
        data = submit_resp.json()
        self.assertTrue(data['success'])
        self.assertIn('evaluation', data)
        eval_data = data['evaluation']
        self.assertGreater(eval_data['score'], 50.0)
        self.assertTrue(len(eval_data['strengths']) > 0)
        self.assertTrue(len(eval_data['model_answer']) > 0)

        # Check question was updated in DB
        q = InterviewQuestion.objects.get(id=question_id)
        self.assertTrue(q.is_answered)
        self.assertEqual(q.candidate_answer, candidate_answer)
        self.assertEqual(q.score, eval_data['score'])

    def test_finish_interview_session(self):
        """Tests concluding session and aggregate scorecard generation."""
        create_resp = self.client.post(
            reverse('interview_sessions'),
            {'role': 'Full-Stack Engineer', 'total_questions': 1},
            format='json'
        )
        session_id = create_resp.json()['session']['id']
        q_id = create_resp.json()['current_question']['id']

        self.client.post(
            reverse('interview_submit_answer', kwargs={'session_id': session_id}),
            {'question_id': q_id, 'candidate_answer': 'We use CRDTs and WebSockets for low-latency state sync.'},
            format='json'
        )

        finish_resp = self.client.post(
            reverse('interview_finish_session', kwargs={'session_id': session_id}),
            format='json'
        )
        self.assertEqual(finish_resp.status_code, 200)
        session = InterviewSession.objects.get(id=session_id)
        self.assertEqual(session.status, 'completed')
        self.assertGreater(session.overall_score, 0)
        self.assertNotEqual(session.hiring_verdict, 'Pending Evaluation')

    def test_analytics_endpoint(self):
        """Tests analytics summary endpoint."""
        resp = self.client.get(reverse('interview_analytics'))
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()['success'])
        self.assertIn('analytics', resp.json())
