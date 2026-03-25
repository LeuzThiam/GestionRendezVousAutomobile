from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from organizations.models import Organization
from planification.models import DisponibiliteGarage, FermetureExceptionnelleGarage
from prestations.models import CategoriePrestation, ServiceOffert


class GarageApiTests(APITestCase):
    def test_owner_can_register_garage(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'organization_name': 'Garage Flow Montreal',
                'username': 'owner1',
                'email': 'owner@example.com',
                'first_name': 'Ali',
                'last_name': 'Diallo',
                'password': 'testpass123',
                'password2': 'testpass123',
                'phone': '5140000000',
                'address': '123 Rue du Test',
                'description': 'Garage automobile specialise en entretien general.',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        garage = Organization.objects.get(name='Garage Flow Montreal')
        self.assertEqual(garage.owner.username, 'owner1')
        self.assertEqual(garage.owner.profile.role, 'owner')
        self.assertEqual(garage.owner.profile.garage, garage)
        self.assertEqual(garage.description, 'Garage automobile specialise en entretien general.')

    def test_current_garage_returns_authenticated_garage(self):
        owner = User.objects.create_user(
            username='owner2',
            email='owner2@example.com',
            password='testpass123',
        )
        garage = Organization.objects.create(name='Garage Laval', slug='garage-laval', owner=owner)
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()

        refresh = RefreshToken.for_user(owner)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.get('/api/organizations/me/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], garage.id)
        self.assertEqual(response.data['name'], 'Garage Laval')

    def test_owner_can_update_current_garage_profile(self):
        owner = User.objects.create_user(
            username='owner-update',
            email='owner-update@example.com',
            password='testpass123',
        )
        garage = Organization.objects.create(
            name='Garage Profil',
            slug='garage-profil',
            owner=owner,
            address='Adresse initiale',
        )
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()

        refresh = RefreshToken.for_user(owner)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.patch(
            '/api/organizations/me/',
            {
                'phone': '5810000000',
                'address': 'Nouvelle adresse',
                'description': 'Garage specialise en entretien preventif.',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        garage.refresh_from_db()
        self.assertEqual(garage.phone, '5810000000')
        self.assertEqual(garage.address, 'Nouvelle adresse')
        self.assertEqual(garage.description, 'Garage specialise en entretien preventif.')

    def test_public_garage_detail_returns_public_information(self):
        owner = User.objects.create_user(
            username='owner3',
            email='owner3@example.com',
            password='testpass123',
        )
        garage = Organization.objects.create(
            name='Garage Public',
            slug='garage-public',
            type_etablissement='automobile',
            owner=owner,
            description='Garage de quartier pour entretien et diagnostics.',
        )
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()

        employe = User.objects.create_user(
            username='meca-public',
            email='meca-public@example.com',
            password='testpass123',
            first_name='Jean',
            last_name='Garage',
        )
        employe.profile.role = 'employe'
        employe.profile.garage = garage
        employe.profile.save()
        cat_ent = CategoriePrestation.objects.get(garage=garage, slug='entretien')
        cat_diag = CategoriePrestation.objects.get(garage=garage, slug='diagnostic')
        ServiceOffert.objects.create(
            garage=garage,
            nom='Vidange',
            categorie=cat_ent,
            description='Entretien huile moteur',
            duree_estimee='1.00',
            prix_indicatif='79.99',
            ordre_affichage=2,
        )
        ServiceOffert.objects.create(
            garage=garage,
            nom='Diagnostic freinage',
            categorie=cat_diag,
            description='Controle plus prioritaire',
            duree_estimee='0.50',
            prix_indicatif='39.99',
            ordre_affichage=1,
        )
        DisponibiliteGarage.objects.create(
            garage=garage,
            jour_semaine=0,
            heure_debut='08:00',
            heure_fin='12:00',
        )

        response = self.client.get('/api/organizations/public/garage-public/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Garage Public')
        self.assertEqual(response.data['description'], 'Garage de quartier pour entretien et diagnostics.')
        self.assertEqual(len(response.data['employes']), 1)
        self.assertEqual(response.data['employes'][0]['first_name'], 'Jean')
        self.assertEqual(len(response.data['services']), 2)
        self.assertEqual(response.data['services'][0]['nom'], 'Diagnostic freinage')
        self.assertEqual(response.data['services'][0]['categorie_slug'], 'diagnostic')
        self.assertEqual(response.data['services'][1]['ordre_affichage'], 2)
        self.assertEqual(len(response.data['disponibilites']), 1)
        self.assertEqual(response.data['disponibilites'][0]['jour_label'], 'Lundi')

    def test_public_garage_list_can_be_searched(self):
        owner = User.objects.create_user(
            username='owner4',
            email='owner4@example.com',
            password='testpass123',
        )
        garage = Organization.objects.create(name='Garage Recherche', slug='garage-recherche', owner=owner)
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()

        response = self.client.get('/api/organizations/public/?q=recher')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['slug'], 'garage-recherche')

    def test_public_garage_list_includes_services_and_supports_service_search(self):
        owner = User.objects.create_user(
            username='owner5',
            email='owner5@example.com',
            password='testpass123',
        )
        garage = Organization.objects.create(
            name='Garage Filtre',
            slug='garage-filtre',
            type_etablissement='automobile',
            owner=owner,
            address='Quebec',
            description='Specialiste climatisation et entretien.',
        )
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()
        cat_ent = CategoriePrestation.objects.get(garage=garage, slug='entretien')
        ServiceOffert.objects.create(
            garage=garage,
            nom='Climatisation',
            categorie=cat_ent,
            description='Entretien de la climatisation',
            duree_estimee='1.00',
            prix_indicatif='99.00',
            actif=True,
        )

        response = self.client.get('/api/organizations/public/?q=clim')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['slug'], 'garage-filtre')
        self.assertIn('Climatisation', response.data[0]['services'])
        self.assertEqual(response.data[0]['description'], 'Specialiste climatisation et entretien.')

    def test_owner_can_create_service_for_garage(self):
        owner = User.objects.create_user(username='owner-service', password='testpass123')
        garage = Organization.objects.create(
            name='Garage Service',
            slug='garage-service',
            type_etablissement='automobile',
            owner=owner,
        )
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()

        cat_diag = CategoriePrestation.objects.get(garage=garage, slug='diagnostic')

        refresh = RefreshToken.for_user(owner)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.post(
            '/api/organizations/me/services/',
            {
                'nom': 'Diagnostic',
                'categorie': cat_diag.id,
                'description': 'Analyse electronique du vehicule',
                'duree_estimee': '0.75',
                'prix_indicatif': '49.99',
                'ordre_affichage': 3,
                'actif': True,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ServiceOffert.objects.filter(garage=garage).count(), 1)
        self.assertEqual(response.data['categorie'], cat_diag.id)
        self.assertEqual(response.data['ordre_affichage'], 3)

    def test_owner_cannot_create_service_without_duration_or_price(self):
        owner = User.objects.create_user(username='owner-service-invalid', password='testpass123')
        garage = Organization.objects.create(
            name='Garage Service Invalid',
            slug='garage-service-invalid',
            type_etablissement='automobile',
            owner=owner,
        )
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()

        refresh = RefreshToken.for_user(owner)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        cat_urg = CategoriePrestation.objects.get(garage=garage, slug='urgence')

        response = self.client.post(
            '/api/organizations/me/services/',
            {
                'nom': 'Urgence moteur',
                'categorie': cat_urg.id,
                'description': 'Intervention rapide',
                'actif': True,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('duree_estimee', response.data)
        self.assertIn('prix_indicatif', response.data)

    def test_owner_can_create_disponibilite_for_garage(self):
        owner = User.objects.create_user(username='owner-dispo', password='testpass123')
        garage = Organization.objects.create(name='Garage Dispo', slug='garage-dispo', owner=owner)
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()

        refresh = RefreshToken.for_user(owner)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.post(
            '/api/organizations/me/disponibilites/',
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

    def test_owner_cannot_create_overlapping_disponibilite_for_same_day(self):
        owner = User.objects.create_user(username='owner-overlap', password='testpass123')
        garage = Organization.objects.create(name='Garage Overlap', slug='garage-overlap', owner=owner)
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()
        DisponibiliteGarage.objects.create(
            garage=garage,
            jour_semaine=1,
            heure_debut='09:00',
            heure_fin='12:00',
            actif=True,
        )

        refresh = RefreshToken.for_user(owner)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.post(
            '/api/organizations/me/disponibilites/',
            {
                'jour_semaine': 1,
                'heure_debut': '11:00',
                'heure_fin': '13:00',
                'actif': True,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_owner_can_create_fermeture_exceptionnelle(self):
        owner = User.objects.create_user(username='owner-close', password='testpass123')
        garage = Organization.objects.create(name='Garage Close', slug='garage-close', owner=owner)
        owner.profile.role = 'owner'
        owner.profile.garage = garage
        owner.profile.save()

        refresh = RefreshToken.for_user(owner)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.post(
            '/api/organizations/me/fermetures/',
            {
                'date': '2026-12-25',
                'toute_la_journee': True,
                'raison': 'Noel',
                'actif': True,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FermetureExceptionnelleGarage.objects.filter(garage=garage).count(), 1)
