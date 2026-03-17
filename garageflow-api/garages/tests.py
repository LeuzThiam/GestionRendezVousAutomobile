from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from garages.models import Garage


class GarageApiTests(APITestCase):
    def test_owner_can_register_garage(self):
        response = self.client.post(
            '/api/garages/register/',
            {
                'garage_name': 'Garage Flow Montreal',
                'username': 'owner1',
                'email': 'owner@example.com',
                'first_name': 'Ali',
                'last_name': 'Diallo',
                'password': 'testpass123',
                'password2': 'testpass123',
                'phone': '5140000000',
                'address': '123 Rue du Test',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        garage = Garage.objects.get(name='Garage Flow Montreal')
        self.assertEqual(garage.owner.username, 'owner1')
        self.assertEqual(garage.owner.profile.role, 'owner')
        self.assertEqual(garage.owner.profile.garage, garage)

    def test_current_garage_returns_authenticated_garage(self):
        owner = User.objects.create_user(
            username='owner2',
            email='owner2@example.com',
            password='testpass123',
        )
        garage = Garage.objects.create(name='Garage Laval', slug='garage-laval', owner=owner)
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()

        refresh = RefreshToken.for_user(owner)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.get('/api/garages/me/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], garage.id)
        self.assertEqual(response.data['name'], 'Garage Laval')
