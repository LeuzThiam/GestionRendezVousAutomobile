from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from garages.models import Garage
from vehicules.models import Vehicule


class VehiculesApiTests(APITestCase):
    def authenticate(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_client_can_create_vehicle_without_garage_binding(self):
        user = User.objects.create_user(username='client-vehicule', password='testpass123')
        user.profile.role = 'client'
        user.profile.save()
        self.authenticate(user)

        response = self.client.post(
            '/api/vehicules/',
            {
                'marque': 'Toyota',
                'modele': 'Yaris',
                'annee': 2022,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        vehicle = Vehicule.objects.get(id=response.data['id'])
        self.assertEqual(vehicle.owner, user)
        self.assertIsNone(vehicle.garage)

    def test_owner_lists_garage_vehicles(self):
        owner = User.objects.create_user(username='owner-vehicule', password='testpass123')
        garage = Garage.objects.create(name='Garage Vehicule', slug='garage-vehicule', owner=owner)
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()

        Vehicule.objects.create(owner=owner, garage=garage, marque='Ford', modele='Transit', annee=2020)
        other_user = User.objects.create_user(username='client-other', password='testpass123')
        other_user.profile.role = 'client'
        other_user.profile.save()
        Vehicule.objects.create(owner=other_user, marque='Honda', modele='Fit', annee=2019)

        self.authenticate(owner)
        response = self.client.get('/api/vehicules/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['marque'], 'Ford')
