from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from garages.models import Garage
from rendezVous.models import RendezVous
from vehicules.models import Vehicule


class RendezVousApiTests(APITestCase):
    def setUp(self):
        self.garage = Garage.objects.create(
            name='Garage Principal',
            slug='garage-principal',
            owner=User.objects.create_user(
                username='owner-main',
                password='testpass123',
                email='owner-main@example.com',
            ),
        )
        self.second_garage = Garage.objects.create(
            name='Garage Secondaire',
            slug='garage-secondaire',
            owner=User.objects.create_user(
                username='owner-second',
                password='testpass123',
                email='owner-second@example.com',
            ),
        )

        self.garage.owner.profile.role = 'owner'
        self.garage.owner.profile.garage = self.garage
        self.garage.owner.profile.save()

        self.second_garage.owner.profile.role = 'owner'
        self.second_garage.owner.profile.garage = self.second_garage
        self.second_garage.owner.profile.save()

        self.client_user = User.objects.create_user(
            username='client1',
            password='testpass123',
            email='client@example.com',
        )
        self.client_user.profile.role = 'client'
        self.client_user.profile.garage = self.garage
        self.client_user.profile.save()

        self.other_client = User.objects.create_user(
            username='client2',
            password='testpass123',
            email='client2@example.com',
        )
        self.other_client.profile.role = 'client'
        self.other_client.profile.garage = self.second_garage
        self.other_client.profile.save()

        self.mecanicien = User.objects.create_user(
            username='mecano1',
            password='testpass123',
            email='mecano@example.com',
        )
        self.mecanicien.profile.role = 'mecanicien'
        self.mecanicien.profile.garage = self.garage
        self.mecanicien.profile.save()

        self.other_mecanicien = User.objects.create_user(
            username='mecano2',
            password='testpass123',
            email='mecano2@example.com',
        )
        self.other_mecanicien.profile.role = 'mecanicien'
        self.other_mecanicien.profile.garage = self.second_garage
        self.other_mecanicien.profile.save()

        self.vehicle = Vehicule.objects.create(
            owner=self.client_user,
            garage=self.garage,
            marque='Toyota',
            modele='Corolla',
            annee=2020,
            vin='VIN123',
        )
        self.other_vehicle = Vehicule.objects.create(
            owner=self.other_client,
            garage=self.second_garage,
            marque='Honda',
            modele='Civic',
            annee=2021,
            vin='VIN456',
        )

    def authenticate(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_client_can_create_rendezvous_with_own_vehicle(self):
        self.authenticate(self.client_user)

        response = self.client.post(
            '/api/rendezvous/',
            {
                'mecanicien': self.mecanicien.id,
                'vehicule': self.vehicle.id,
                'date': (timezone.now() + timedelta(days=2)).isoformat(),
                'description': 'Freins bruyants',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['client'], self.client_user.id)
        self.assertEqual(response.data['vehicule'], self.vehicle.id)
        self.assertEqual(response.data['status'], 'pending')

    def test_client_cannot_create_rendezvous_with_other_vehicle(self):
        self.authenticate(self.client_user)

        response = self.client.post(
            '/api/rendezvous/',
            {
                'mecanicien': self.mecanicien.id,
                'vehicule': self.other_vehicle.id,
                'date': (timezone.now() + timedelta(days=2)).isoformat(),
                'description': 'Test',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('mecanicien', response.data)
        self.assertIn('vehicule', response.data)

    def test_mecanicien_cannot_create_rendezvous(self):
        self.authenticate(self.mecanicien)

        response = self.client.post(
            '/api/rendezvous/',
            {
                'mecanicien': self.other_mecanicien.id,
                'vehicule': self.vehicle.id,
                'date': (timezone.now() + timedelta(days=2)).isoformat(),
                'description': 'Test',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_client_can_only_request_modification_or_cancel(self):
        rdv = RendezVous.objects.create(
            client=self.client_user,
            mecanicien=self.mecanicien,
            vehicule=self.vehicle,
            date=timezone.now() + timedelta(days=2),
            description='Revision',
        )
        self.authenticate(self.client_user)

        response = self.client.patch(
            f'/api/rendezvous/{rdv.id}/',
            {'status': 'confirmed'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('status', response.data)

    def test_mecanicien_must_provide_quote_and_duration_when_confirming(self):
        rdv = RendezVous.objects.create(
            client=self.client_user,
            mecanicien=self.mecanicien,
            vehicule=self.vehicle,
            date=timezone.now() + timedelta(days=2),
            description='Pneu use',
        )
        self.authenticate(self.mecanicien)

        response = self.client.patch(
            f'/api/rendezvous/{rdv.id}/',
            {'status': 'confirmed'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mecanicien_can_confirm_with_quote_and_duration(self):
        rdv = RendezVous.objects.create(
            client=self.client_user,
            mecanicien=self.mecanicien,
            vehicule=self.vehicle,
            date=timezone.now() + timedelta(days=2),
            description='Vidange',
        )
        self.authenticate(self.mecanicien)

        response = self.client.patch(
            f'/api/rendezvous/{rdv.id}/',
            {'status': 'confirmed', 'estimatedTime': '2.50', 'quote': '180.00'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rdv.refresh_from_db()
        self.assertEqual(rdv.status, 'confirmed')
        self.assertEqual(str(rdv.quote), '180.00')

    def test_mecanicien_must_provide_reason_when_rejecting(self):
        rdv = RendezVous.objects.create(
            client=self.client_user,
            mecanicien=self.mecanicien,
            vehicule=self.vehicle,
            date=timezone.now() + timedelta(days=2),
            description='Diagnostic',
        )
        self.authenticate(self.mecanicien)

        response = self.client.patch(
            f'/api/rendezvous/{rdv.id}/',
            {'status': 'rejected'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('reason', response.data)

    def test_queryset_is_filtered_for_client(self):
        own_rdv = RendezVous.objects.create(
            client=self.client_user,
            mecanicien=self.mecanicien,
            vehicule=self.vehicle,
            date=timezone.now() + timedelta(days=2),
            description='Mon RDV',
        )
        RendezVous.objects.create(
            client=self.other_client,
            mecanicien=self.mecanicien,
            vehicule=self.other_vehicle,
            date=timezone.now() + timedelta(days=3),
            description='Autre RDV',
        )
        self.authenticate(self.client_user)

        response = self.client.get('/api/rendezvous/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], own_rdv.id)
