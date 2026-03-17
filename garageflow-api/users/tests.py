from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from garages.models import Garage


class UsersApiTests(APITestCase):
    def test_auth_owner_register_creates_owner_and_garage(self):
        response = self.client.post(
            '/api/auth/register/owner/',
            {
                'garage_name': 'Garage Owner Test',
                'garage_slug': 'garage-owner-test',
                'phone': '5140000000',
                'address': '123 rue Principale',
                'username': 'owner-register',
                'email': 'owner-register@example.com',
                'first_name': 'Owner',
                'last_name': 'Register',
                'password': 'Testpass1234!',
                'password2': 'Testpass1234!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        owner = User.objects.get(username='owner-register')
        self.assertEqual(owner.profile.role, 'owner')
        self.assertEqual(owner.profile.garage.slug, 'garage-owner-test')

    def test_auth_client_register_creates_client_in_existing_garage(self):
        owner = User.objects.create_user(username='owner-register-client', password='testpass123')
        garage = Garage.objects.create(name='Garage Client Test', slug='garage-client-test', owner=owner)
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()

        response = self.client.post(
            '/api/auth/register/client/',
            {
                'garage_slug': 'garage-client-test',
                'username': 'client-register',
                'email': 'client-register@example.com',
                'first_name': 'Client',
                'last_name': 'Register',
                'password': 'Testpass1234!',
                'password2': 'Testpass1234!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        client = User.objects.get(username='client-register')
        self.assertEqual(client.profile.role, 'client')
        self.assertEqual(client.profile.garage, garage)

    def test_auth_client_register_rejects_unknown_garage_slug(self):
        response = self.client.post(
            '/api/auth/register/client/',
            {
                'garage_slug': 'garage-inconnu',
                'username': 'client-invalid',
                'email': 'client-invalid@example.com',
                'first_name': 'Client',
                'last_name': 'Invalid',
                'password': 'Testpass1234!',
                'password2': 'Testpass1234!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('garage_slug', response.data)

    def test_auth_login_returns_tokens_and_user_for_valid_credentials(self):
        user = User.objects.create_user(
            username='owner-auth',
            email='owner-auth@example.com',
            password='testpass1234',
            first_name='Ali',
            last_name='Diallo',
        )
        garage = Garage.objects.create(name='Garage Auth', slug='garage-auth', owner=user)
        user.profile.role = 'owner'
        user.profile.garage = garage
        user.profile.save()

        response = self.client.post(
            '/api/auth/login/',
            {
                'email': 'owner-auth@example.com',
                'password': 'testpass1234',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], 'owner-auth@example.com')
        self.assertEqual(response.data['user']['role'], 'owner')

    def test_auth_login_rejects_invalid_credentials_with_neutral_message(self):
        User.objects.create_user(
            username='owner-auth-bad',
            email='owner-auth-bad@example.com',
            password='testpass1234',
        )

        response = self.client.post(
            '/api/auth/login/',
            {
                'email': 'owner-auth-bad@example.com',
                'password': 'bad-password',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['non_field_errors'][0], 'Identifiants invalides.')

    def test_auth_me_requires_authentication(self):
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_auth_me_returns_current_user_profile(self):
        user = User.objects.create_user(
            username='client-auth',
            email='client-auth@example.com',
            password='testpass1234',
            first_name='Awa',
            last_name='Ndiaye',
        )
        garage = Garage.objects.create(name='Garage Me', slug='garage-me', owner=user)
        user.profile.role = 'client'
        user.profile.garage = garage
        user.profile.save()

        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.get('/api/auth/me/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'client-auth@example.com')
        self.assertEqual(response.data['role'], 'client')

    def test_mecaniciens_list_is_filtered_by_garage(self):
        owner_a = User.objects.create_user(username='owner-a', password='testpass123')
        owner_b = User.objects.create_user(username='owner-b', password='testpass123')

        garage_a = Garage.objects.create(name='Garage A', slug='garage-a', owner=owner_a)
        garage_b = Garage.objects.create(name='Garage B', slug='garage-b', owner=owner_b)

        owner_a.profile.role = 'owner'
        owner_a.profile.garage = garage_a
        owner_a.profile.save()

        owner_b.profile.role = 'owner'
        owner_b.profile.garage = garage_b
        owner_b.profile.save()

        mecanicien_a = User.objects.create_user(username='meca-a', password='testpass123')
        mecanicien_a.profile.role = 'mecanicien'
        mecanicien_a.profile.garage = garage_a
        mecanicien_a.profile.save()

        mecanicien_b = User.objects.create_user(username='meca-b', password='testpass123')
        mecanicien_b.profile.role = 'mecanicien'
        mecanicien_b.profile.garage = garage_b
        mecanicien_b.profile.save()

        refresh = RefreshToken.for_user(owner_a)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.get('/api/users/mecaniciens/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['username'], 'meca-a')

    def test_owner_can_create_mecanicien_for_own_garage(self):
        owner = User.objects.create_user(username='owner-c', password='testpass123')
        garage = Garage.objects.create(name='Garage C', slug='garage-c', owner=owner)
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()

        refresh = RefreshToken.for_user(owner)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.post(
            '/api/users/owner/mecaniciens/',
            {
                'username': 'meca-c',
                'first_name': 'Meca',
                'last_name': 'Garage',
                'email': 'meca-c@example.com',
                'password': 'testpass123',
                'password2': 'testpass123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        mecanicien = User.objects.get(username='meca-c')
        self.assertEqual(mecanicien.profile.role, 'mecanicien')
        self.assertEqual(mecanicien.profile.garage, garage)

    def test_non_owner_cannot_create_mecanicien(self):
        owner = User.objects.create_user(username='owner-d', password='testpass123')
        garage = Garage.objects.create(name='Garage D', slug='garage-d', owner=owner)
        client = User.objects.create_user(username='client-d', password='testpass123')
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()
        client.profile.role = 'client'
        client.profile.garage = garage
        client.profile.save()

        refresh = RefreshToken.for_user(client)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.post(
            '/api/users/owner/mecaniciens/',
            {
                'username': 'meca-d',
                'first_name': 'Meca',
                'last_name': 'Garage',
                'email': 'meca-d@example.com',
                'password': 'testpass123',
                'password2': 'testpass123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
