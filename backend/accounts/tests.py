from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import Account

class AccountAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.signup_url = reverse('signup')
        self.login_url = reverse('login')
        self.valid_payload = {
            'student_name': 'Test Student',
            'student_email': 'test@example.com',
            'student_password': 'secretpassword123'
        }

    def test_signup_successful(self):
        response = self.client.post(self.signup_url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['user']['student_email'], 'test@example.com')
        # Check in DB
        account = Account.objects.get(student_email='test@example.com')
        self.assertEqual(account.student_name, 'Test Student')
        # Password should be hashed, not plaintext
        self.assertNotEqual(account.student_password, 'secretpassword123')

    def test_signup_duplicate_email(self):
        # First signup
        self.client.post(self.signup_url, self.valid_payload, format='json')
        # Second signup with same email
        response = self.client.post(self.signup_url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('already exists', response.data['error'])

    def test_signup_missing_fields(self):
        payload = {'student_name': 'Incomplete'}
        response = self.client.post(self.signup_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_login_successful(self):
        # Create student account via signup
        self.client.post(self.signup_url, self.valid_payload, format='json')

        # Login
        login_payload = {
            'student_email': 'test@example.com',
            'student_password': 'secretpassword123'
        }
        response = self.client.post(self.login_url, login_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['user']['student_email'], 'test@example.com')

    def test_login_wrong_password(self):
        # Create student account via signup
        self.client.post(self.signup_url, self.valid_payload, format='json')

        # Login with wrong password
        login_payload = {
            'student_email': 'test@example.com',
            'student_password': 'wrongpassword'
        }
        response = self.client.post(self.login_url, login_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('Invalid', response.data['error'])

    def test_github_auth_status_configured(self):
        github_status_url = reverse('github_auth_status')
        response = self.client.get(github_status_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['configured'])
        self.assertTrue(response.data['client_id_present'])
        self.assertTrue(response.data['client_secret_present'])

    def test_logout_view(self):
        logout_url = reverse('logout')
        response = self.client.post(logout_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

    def test_github_login_redirect(self):
        github_login_url = reverse('github_login')
        response = self.client.get(github_login_url)
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertIn('github.com/login/oauth/authorize', response.headers.get('Location'))
        self.assertIn('client_id=Ov23liEqEVGQkBKJlQfi', response.headers.get('Location'))


from django.core.files.uploadedfile import SimpleUploadedFile
from .models import Resume


class ResumeStorageTests(TestCase):
    def setUp(self):
        self.client_user1 = APIClient()
        self.client_user2 = APIClient()

        # Create two distinct test student accounts
        self.user1 = Account.objects.create_user(
            student_email='alice@example.com',
            student_name='Alice Developer',
            password='password123'
        )
        self.user2 = Account.objects.create_user(
            student_email='bob@example.com',
            student_name='Bob Engineer',
            password='password123'
        )

        # Authenticate clients
        self.client_user1.force_authenticate(user=self.user1)
        self.client_user2.force_authenticate(user=self.user2)

        self.upload_url = reverse('resume_upload')
        self.list_url = reverse('resume_list')
        self.latest_url = reverse('resume_latest')

        # Minimal valid PDF content with PDF header and text
        self.sample_pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Title (Resume) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"

    def test_unauthenticated_upload_rejected(self):
        unauth_client = APIClient()
        pdf_file = SimpleUploadedFile("resume.pdf", self.sample_pdf_bytes, content_type="application/pdf")
        response = unauth_client.post(self.upload_url, {'file': pdf_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])

    def test_non_pdf_upload_rejected(self):
        txt_file = SimpleUploadedFile("resume.txt", b"plain text content", content_type="text/plain")
        response = self.client_user1.post(self.upload_url, {'file': txt_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_successful_user_isolated_resume_upload(self):
        # Alice uploads a resume
        pdf_file_alice = SimpleUploadedFile("alice_software_resume.pdf", self.sample_pdf_bytes, content_type="application/pdf")
        response_alice = self.client_user1.post(self.upload_url, {'file': pdf_file_alice}, format='multipart')
        self.assertEqual(response_alice.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response_alice.data['success'])
        self.assertEqual(response_alice.data['resume']['file_name'], 'alice_software_resume.pdf')
        self.assertTrue(response_alice.data['resume']['is_active'])

        # Verify DB association and isolated path containing user ID
        resume_alice = Resume.objects.get(id=response_alice.data['resume']['id'])
        self.assertEqual(resume_alice.user, self.user1)
        self.assertIn(f"resumes/user_{self.user1.id}/", resume_alice.file.name)

        # Bob uploads his resume
        pdf_file_bob = SimpleUploadedFile("bob_systems_resume.pdf", self.sample_pdf_bytes, content_type="application/pdf")
        response_bob = self.client_user2.post(self.upload_url, {'file': pdf_file_bob}, format='multipart')
        self.assertEqual(response_bob.status_code, status.HTTP_201_CREATED)

        resume_bob = Resume.objects.get(id=response_bob.data['resume']['id'])
        self.assertEqual(resume_bob.user, self.user2)
        self.assertIn(f"resumes/user_{self.user2.id}/", resume_bob.file.name)

        # Alice cannot see Bob's resumes, Bob cannot see Alice's resumes
        alice_list = self.client_user1.get(self.list_url).data
        bob_list = self.client_user2.get(self.list_url).data
        self.assertEqual(len(alice_list['resumes']), 1)
        self.assertEqual(alice_list['resumes'][0]['file_name'], 'alice_software_resume.pdf')
        self.assertEqual(len(bob_list['resumes']), 1)
        self.assertEqual(bob_list['resumes'][0]['file_name'], 'bob_systems_resume.pdf')

    def test_upload_new_resume_deactivates_older_resume(self):
        # Alice uploads first resume
        f1 = SimpleUploadedFile("alice_v1.pdf", self.sample_pdf_bytes, content_type="application/pdf")
        r1 = self.client_user1.post(self.upload_url, {'file': f1}, format='multipart').data['resume']['id']

        # Alice uploads second resume
        f2 = SimpleUploadedFile("alice_v2.pdf", self.sample_pdf_bytes, content_type="application/pdf")
        r2 = self.client_user1.post(self.upload_url, {'file': f2}, format='multipart').data['resume']['id']

        resume1 = Resume.objects.get(id=r1)
        resume2 = Resume.objects.get(id=r2)

        self.assertFalse(resume1.is_active)
        self.assertTrue(resume2.is_active)

        # latest_resume returns resume2
        latest_res = self.client_user1.get(self.latest_url).data
        self.assertEqual(latest_res['resume']['id'], r2)

    def test_user_cannot_delete_other_user_resume(self):
        # Alice uploads a resume
        f = SimpleUploadedFile("alice_private.pdf", self.sample_pdf_bytes, content_type="application/pdf")
        alice_resume_id = self.client_user1.post(self.upload_url, {'file': f}, format='multipart').data['resume']['id']

        # Bob attempts to delete Alice's resume
        delete_url = reverse('resume_delete', kwargs={'resume_id': alice_resume_id})
        response = self.client_user2.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Resume.objects.filter(id=alice_resume_id).exists())

        # Alice deletes her own resume
        response_alice = self.client_user1.delete(delete_url)
        self.assertEqual(response_alice.status_code, status.HTTP_200_OK)
        self.assertFalse(Resume.objects.filter(id=alice_resume_id).exists())

