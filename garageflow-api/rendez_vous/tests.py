from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from garages.models import DisponibiliteGarage, Garage, ServiceOffert
from rendez_vous.models import RendezVous, ReprogrammationProposition
from users.models import MecanicienDisponibilite
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
        self.client_user.profile.save()

        self.other_client = User.objects.create_user(
            username='client2',
            password='testpass123',
            email='client2@example.com',
        )
        self.other_client.profile.role = 'client'
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
        self.service = ServiceOffert.objects.create(
            garage=self.garage,
            nom='Vidange',
            description='Entretien standard',
        )
        self.other_service = ServiceOffert.objects.create(
            garage=self.second_garage,
            nom='Freinage',
            description='Inspection freins',
        )
        for jour in range(7):
            DisponibiliteGarage.objects.create(
                garage=self.garage,
                jour_semaine=jour,
                heure_debut='08:00',
                heure_fin='18:00',
            )
            DisponibiliteGarage.objects.create(
                garage=self.second_garage,
                jour_semaine=jour,
                heure_debut='08:00',
                heure_fin='18:00',
            )

    def authenticate(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def build_local_datetime(self, days=2, hour=10, minute=0):
        return timezone.localtime(timezone.now() + timedelta(days=days)).replace(
            hour=hour,
            minute=minute,
            second=0,
            microsecond=0,
        )

    def assert_same_minute(self, left, right):
        self.assertEqual(
            timezone.localtime(left).strftime('%Y-%m-%dT%H:%M'),
            timezone.localtime(right).strftime('%Y-%m-%dT%H:%M'),
        )

    def test_client_can_create_rendezvous_with_own_vehicle(self):
        self.authenticate(self.client_user)

        response = self.client.post(
            '/api/rendezvous/',
            {
                'garage': self.garage.id,
                'vehicule': self.vehicle.id,
                'service': self.service.id,
                'date': self.build_local_datetime(days=2, hour=10).isoformat(),
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
                'garage': self.garage.id,
                'vehicule': self.other_vehicle.id,
                'service': self.service.id,
                'date': self.build_local_datetime(days=2, hour=10).isoformat(),
                'description': 'Test',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('vehicule', response.data)

    def test_client_cannot_choose_mecanicien_during_creation(self):
        self.authenticate(self.client_user)

        response = self.client.post(
            '/api/rendezvous/',
            {
                'garage': self.garage.id,
                'mecanicien': self.mecanicien.id,
                'vehicule': self.vehicle.id,
                'service': self.service.id,
                'date': self.build_local_datetime(days=2, hour=10).isoformat(),
                'description': 'Demande client',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('mecanicien', response.data)

    def test_client_cannot_choose_service_from_other_garage(self):
        self.authenticate(self.client_user)

        response = self.client.post(
            '/api/rendezvous/',
            {
                'garage': self.garage.id,
                'vehicule': self.vehicle.id,
                'service': self.other_service.id,
                'date': self.build_local_datetime(days=2, hour=10).isoformat(),
                'description': 'Demande service invalide',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('service', response.data)

    def test_mecanicien_cannot_create_rendezvous(self):
        self.authenticate(self.mecanicien)

        response = self.client.post(
            '/api/rendezvous/',
            {
                'mecanicien': self.other_mecanicien.id,
                'garage': self.second_garage.id,
                'vehicule': self.vehicle.id,
                'date': self.build_local_datetime(days=2, hour=10).isoformat(),
                'description': 'Test',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_can_only_request_modification_or_cancel(self):
        rdv = RendezVous.objects.create(
            garage=self.garage,
            client=self.client_user,
            mecanicien=self.mecanicien,
            vehicule=self.vehicle,
            date=self.build_local_datetime(days=2, hour=10),
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

    def test_client_modification_request_keeps_original_date_and_stores_requested_date(self):
        initial_date = self.build_local_datetime(days=2, hour=10)
        requested_date = self.build_local_datetime(days=4, hour=14)
        rdv = RendezVous.objects.create(
            garage=self.garage,
            client=self.client_user,
            mecanicien=self.mecanicien,
            vehicule=self.vehicle,
            service=self.service,
            date=initial_date,
            status='confirmed',
            estimatedTime='1.00',
            quote='100.00',
            description='Modification client',
        )
        self.authenticate(self.client_user)

        response = self.client.patch(
            f'/api/rendezvous/{rdv.id}/',
            {
                'status': 'modification_requested',
                'requested_date': requested_date.isoformat(),
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rdv.refresh_from_db()
        self.assertEqual(rdv.status, 'modification_requested')
        self.assert_same_minute(rdv.date, initial_date)
        self.assert_same_minute(rdv.requested_date, requested_date)
        proposal = rdv.reprogrammation_propositions.get()
        self.assertEqual(proposal.proposal_type, 'client_request')
        self.assertEqual(proposal.response_status, 'pending')
        self.assert_same_minute(proposal.proposed_date, requested_date)
        self.assertEqual(proposal.created_by, self.client_user)

    def test_mecanicien_must_provide_quote_and_duration_when_confirming(self):
        rdv = RendezVous.objects.create(
            garage=self.garage,
            client=self.client_user,
            mecanicien=self.mecanicien,
            vehicule=self.vehicle,
            date=self.build_local_datetime(days=2, hour=10),
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
            garage=self.garage,
            client=self.client_user,
            mecanicien=self.mecanicien,
            vehicule=self.vehicle,
            date=self.build_local_datetime(days=2, hour=10),
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

    def test_owner_can_confirm_and_assign_mecanicien(self):
        rdv = RendezVous.objects.create(
            garage=self.garage,
            client=self.client_user,
            vehicule=self.vehicle,
            date=self.build_local_datetime(days=2, hour=10),
            description='Pneu a verifier',
        )
        self.authenticate(self.garage.owner)

        response = self.client.patch(
            f'/api/rendezvous/{rdv.id}/',
            {
                'status': 'confirmed',
                'mecanicien': self.mecanicien.id,
                'estimatedTime': '1.50',
                'quote': '120.00',
                'date': self.build_local_datetime(days=2, hour=11).isoformat(),
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rdv.refresh_from_db()
        self.assertEqual(rdv.status, 'confirmed')
        self.assertEqual(rdv.mecanicien, self.mecanicien)
        self.assertEqual(rdv.confirmed_by, self.garage.owner)
        self.assertIsNotNone(rdv.confirmed_at)

    def test_owner_can_confirm_with_new_date(self):
        initial_date = self.build_local_datetime(days=2, hour=10)
        updated_date = self.build_local_datetime(days=5, hour=11)
        rdv = RendezVous.objects.create(
            garage=self.garage,
            client=self.client_user,
            vehicule=self.vehicle,
            date=initial_date,
            description='Reprogrammation',
        )
        self.authenticate(self.garage.owner)

        response = self.client.patch(
            f'/api/rendezvous/{rdv.id}/',
            {
                'status': 'confirmed',
                'mecanicien': self.mecanicien.id,
                'estimatedTime': '2.00',
                'quote': '150.00',
                'date': updated_date.isoformat(),
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rdv.refresh_from_db()
        self.assertEqual(rdv.mecanicien, self.mecanicien)
        self.assertEqual(rdv.status, 'confirmed')
        self.assert_same_minute(rdv.date, updated_date)
        self.assertEqual(rdv.reprogrammed_by, self.garage.owner)
        self.assertIsNotNone(rdv.reprogrammed_at)

    def test_owner_can_accept_requested_date_without_resending_date(self):
        initial_date = self.build_local_datetime(days=2, hour=10)
        requested_date = self.build_local_datetime(days=5, hour=11)
        rdv = RendezVous.objects.create(
            garage=self.garage,
            client=self.client_user,
            vehicule=self.vehicle,
            service=self.service,
            date=initial_date,
            requested_date=requested_date,
            status='modification_requested',
            description='Reprogrammation propre',
        )
        ReprogrammationProposition.objects.create(
            rendez_vous=rdv,
            proposed_date=requested_date,
            proposal_type='client_request',
            created_by=self.client_user,
        )
        self.authenticate(self.garage.owner)

        response = self.client.patch(
            f'/api/rendezvous/{rdv.id}/',
            {
                'status': 'confirmed',
                'mecanicien': self.mecanicien.id,
                'estimatedTime': '2.00',
                'quote': '150.00',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rdv.refresh_from_db()
        self.assertEqual(rdv.status, 'confirmed')
        self.assert_same_minute(rdv.date, requested_date)
        self.assertIsNone(rdv.requested_date)
        proposal = rdv.reprogrammation_propositions.get(proposal_type='client_request')
        self.assertEqual(proposal.response_status, 'accepted')
        self.assertEqual(proposal.responded_by, self.garage.owner)
        self.assertIsNotNone(proposal.responded_at)

    def test_owner_counter_proposal_is_recorded_in_history_with_internal_note(self):
        initial_date = self.build_local_datetime(days=2, hour=10)
        requested_date = self.build_local_datetime(days=5, hour=11)
        counter_date = self.build_local_datetime(days=6, hour=9)
        rdv = RendezVous.objects.create(
            garage=self.garage,
            client=self.client_user,
            vehicule=self.vehicle,
            service=self.service,
            date=initial_date,
            requested_date=requested_date,
            status='modification_requested',
            description='Reprogrammation avec contre-proposition',
        )
        client_proposal = ReprogrammationProposition.objects.create(
            rendez_vous=rdv,
            proposed_date=requested_date,
            proposal_type='client_request',
            created_by=self.client_user,
        )
        self.authenticate(self.garage.owner)

        response = self.client.patch(
            f'/api/rendezvous/{rdv.id}/',
            {
                'status': 'confirmed',
                'mecanicien': self.mecanicien.id,
                'estimatedTime': '1.50',
                'quote': '130.00',
                'date': counter_date.isoformat(),
                'garage_internal_note': 'Le creneau client n etait pas tenable pour l atelier.',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rdv.refresh_from_db()
        client_proposal.refresh_from_db()
        self.assertEqual(client_proposal.response_status, 'rejected')
        garage_counter = rdv.reprogrammation_propositions.get(proposal_type='garage_counter')
        self.assertEqual(garage_counter.response_status, 'accepted')
        self.assertEqual(garage_counter.internal_note, 'Le creneau client n etait pas tenable pour l atelier.')
        self.assert_same_minute(garage_counter.proposed_date, counter_date)

    def test_client_response_does_not_expose_internal_notes(self):
        rdv = RendezVous.objects.create(
            garage=self.garage,
            client=self.client_user,
            vehicule=self.vehicle,
            service=self.service,
            date=self.build_local_datetime(days=2, hour=10),
            description='Masquer la note interne',
        )
        ReprogrammationProposition.objects.create(
            rendez_vous=rdv,
            proposed_date=self.build_local_datetime(days=4, hour=14),
            proposal_type='garage_counter',
            created_by=self.garage.owner,
            internal_note='Ne pas exposer au client',
            response_status='accepted',
            responded_at=timezone.now(),
            responded_by=self.garage.owner,
        )
        self.authenticate(self.client_user)

        response = self.client.get(f'/api/rendezvous/{rdv.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('internal_note', response.data['reschedule_history'][0])

    def test_owner_cannot_confirm_without_mecanicien(self):
        rdv = RendezVous.objects.create(
            garage=self.garage,
            client=self.client_user,
            vehicule=self.vehicle,
            date=self.build_local_datetime(days=2, hour=10),
            description='Verification',
        )
        self.authenticate(self.garage.owner)

        response = self.client.patch(
            f'/api/rendezvous/{rdv.id}/',
            {
                'status': 'confirmed',
                'estimatedTime': '1.00',
                'quote': '90.00',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('mecanicien', response.data)

    def test_owner_cannot_confirm_outside_garage_availability(self):
        rdv = RendezVous.objects.create(
            garage=self.garage,
            client=self.client_user,
            vehicule=self.vehicle,
            date=self.build_local_datetime(days=2, hour=10),
            description='Hors disponibilite',
        )
        self.authenticate(self.garage.owner)

        response = self.client.patch(
            f'/api/rendezvous/{rdv.id}/',
            {
                'status': 'confirmed',
                'mecanicien': self.mecanicien.id,
                'estimatedTime': '1.00',
                'quote': '90.00',
                'date': self.build_local_datetime(days=2, hour=22).isoformat(),
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('date', response.data)

    def test_owner_cannot_confirm_mecanicien_on_conflicting_slot(self):
        slot = self.build_local_datetime(days=2, hour=10)
        RendezVous.objects.create(
            garage=self.garage,
            client=self.other_client,
            mecanicien=self.mecanicien,
            vehicule=self.vehicle,
            service=self.service,
            date=slot,
            status='confirmed',
            estimatedTime='1.00',
            quote='100.00',
            description='Deja planifie',
        )
        rdv = RendezVous.objects.create(
            garage=self.garage,
            client=self.client_user,
            vehicule=self.vehicle,
            service=self.service,
            date=slot,
            description='Conflit planning',
        )
        self.authenticate(self.garage.owner)

        response = self.client.patch(
            f'/api/rendezvous/{rdv.id}/',
            {
                'status': 'confirmed',
                'mecanicien': self.mecanicien.id,
                'estimatedTime': '1.00',
                'quote': '90.00',
                'date': slot.isoformat(),
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('mecanicien', response.data)

    def test_owner_cannot_confirm_outside_mecanicien_availability(self):
        MecanicienDisponibilite.objects.create(
            mecanicien=self.mecanicien,
            jour_semaine=self.build_local_datetime(days=2, hour=10).weekday(),
            heure_debut='08:00',
            heure_fin='09:00',
        )
        rdv = RendezVous.objects.create(
            garage=self.garage,
            client=self.client_user,
            vehicule=self.vehicle,
            service=self.service,
            date=self.build_local_datetime(days=2, hour=10),
            description='Verification disponibilite mecanicien',
        )
        self.authenticate(self.garage.owner)

        response = self.client.patch(
            f'/api/rendezvous/{rdv.id}/',
            {
                'status': 'confirmed',
                'mecanicien': self.mecanicien.id,
                'estimatedTime': '1.00',
                'quote': '90.00',
                'date': self.build_local_datetime(days=2, hour=10).isoformat(),
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('mecanicien', response.data)

    def test_mecanicien_must_provide_reason_when_rejecting(self):
        rdv = RendezVous.objects.create(
            garage=self.garage,
            client=self.client_user,
            mecanicien=self.mecanicien,
            vehicule=self.vehicle,
            date=self.build_local_datetime(days=2, hour=10),
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

    def test_owner_reject_tracks_decision_history(self):
        rdv = RendezVous.objects.create(
            garage=self.garage,
            client=self.client_user,
            vehicule=self.vehicle,
            date=self.build_local_datetime(days=2, hour=10),
            description='Demande a refuser',
        )
        self.authenticate(self.garage.owner)

        response = self.client.patch(
            f'/api/rendezvous/{rdv.id}/',
            {'status': 'rejected', 'reason': 'Atelier complet'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rdv.refresh_from_db()
        self.assertEqual(rdv.rejected_by, self.garage.owner)
        self.assertIsNotNone(rdv.rejected_at)

    def test_queryset_is_filtered_for_client(self):
        own_rdv = RendezVous.objects.create(
            garage=self.garage,
            client=self.client_user,
            mecanicien=self.mecanicien,
            vehicule=self.vehicle,
            date=self.build_local_datetime(days=2, hour=10),
            description='Mon RDV',
        )
        RendezVous.objects.create(
            garage=self.second_garage,
            client=self.other_client,
            mecanicien=self.mecanicien,
            vehicule=self.other_vehicle,
            date=self.build_local_datetime(days=3, hour=10),
            description='Autre RDV',
        )
        self.authenticate(self.client_user)

        response = self.client.get('/api/rendezvous/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], own_rdv.id)

    def test_client_can_create_rendezvous_for_any_active_garage(self):
        self.authenticate(self.client_user)

        response = self.client.post(
            '/api/rendezvous/',
            {
                'garage': self.second_garage.id,
                'vehicule': self.vehicle.id,
                'service': self.other_service.id,
                'date': self.build_local_datetime(days=4, hour=10).isoformat(),
                'description': 'Voyant moteur allume',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['garage'], self.second_garage.id)
        self.assertEqual(response.data['client'], self.client_user.id)
        self.assertIsNone(response.data['mecanicien'])
