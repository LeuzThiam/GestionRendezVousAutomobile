from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from garages.models import DisponibiliteGarage, Garage, ServiceOffert


class GarageApiTests(APITestCase):
    def test_owner_can_register_garage(self):
        response = self.client.post(
            '/api/auth/register/',
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

    def test_public_garage_detail_returns_public_information(self):
        owner = User.objects.create_user(
            username='owner3',
            email='owner3@example.com',
            password='testpass123',
        )
        garage = Garage.objects.create(name='Garage Public', slug='garage-public', owner=owner)
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()

        mecanicien = User.objects.create_user(
            username='meca-public',
            email='meca-public@example.com',
            password='testpass123',
            first_name='Jean',
            last_name='Garage',
        )
        mecanicien.profile.role = 'mecanicien'
        mecanicien.profile.garage = garage
        mecanicien.profile.save()
        ServiceOffert.objects.create(
            garage=garage,
            nom='Vidange',
            description='Entretien huile moteur',
            duree_estimee='1.00',
            prix_indicatif='79.99',
        )
        DisponibiliteGarage.objects.create(
            garage=garage,
            jour_semaine=0,
            heure_debut='08:00',
            heure_fin='12:00',
        )

        response = self.client.get('/api/garages/public/garage-public/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Garage Public')
        self.assertEqual(len(response.data['mecaniciens']), 1)
        self.assertEqual(response.data['mecaniciens'][0]['first_name'], 'Jean')
        self.assertEqual(len(response.data['services']), 1)
        self.assertEqual(response.data['services'][0]['nom'], 'Vidange')
        self.assertEqual(len(response.data['disponibilites']), 1)
        self.assertEqual(response.data['disponibilites'][0]['jour_label'], 'Lundi')

    def test_public_garage_list_can_be_searched(self):
        owner = User.objects.create_user(
            username='owner4',
            email='owner4@example.com',
            password='testpass123',
        )
        garage = Garage.objects.create(name='Garage Recherche', slug='garage-recherche', owner=owner)
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()

        response = self.client.get('/api/garages/public/?q=recher')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['slug'], 'garage-recherche')

    def test_public_garage_list_includes_services_and_supports_service_search(self):
        owner = User.objects.create_user(
            username='owner5',
            email='owner5@example.com',
            password='testpass123',
        )
        garage = Garage.objects.create(
            name='Garage Filtre',
            slug='garage-filtre',
            owner=owner,
            address='Quebec',
        )
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()
        ServiceOffert.objects.create(
            garage=garage,
            nom='Climatisation',
            description='Entretien de la climatisation',
            actif=True,
        )

        response = self.client.get('/api/garages/public/?q=clim')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['slug'], 'garage-filtre')
        self.assertIn('Climatisation', response.data[0]['services'])

    def test_owner_can_create_service_for_garage(self):
        owner = User.objects.create_user(username='owner-service', password='testpass123')
        garage = Garage.objects.create(name='Garage Service', slug='garage-service', owner=owner)
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()

        refresh = RefreshToken.for_user(owner)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.post(
            '/api/garages/me/services/',
            {
                'nom': 'Diagnostic',
                'description': 'Analyse electronique du vehicule',
                'duree_estimee': '0.75',
                'prix_indicatif': '49.99',
                'actif': True,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ServiceOffert.objects.filter(garage=garage).count(), 1)

    def test_owner_can_create_disponibilite_for_garage(self):
        owner = User.objects.create_user(username='owner-dispo', password='testpass123')
        garage = Garage.objects.create(name='Garage Dispo', slug='garage-dispo', owner=owner)
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()

        refresh = RefreshToken.for_user(owner)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.post(
            '/api/garages/me/disponibilites/',
            {
                'jour_semaine': 2,
                'heure_debut': '09:00',
                'heure_fin': '17:00',
                'actif': True,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(DisponibiliteGarage.objects.filter(garage=garage).count(), 1)
