from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from garages.models import Garage


class UsersApiTests(APITestCase):
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
