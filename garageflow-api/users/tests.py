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
