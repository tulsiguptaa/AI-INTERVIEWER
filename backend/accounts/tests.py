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
