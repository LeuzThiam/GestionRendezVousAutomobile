# rendez_vous/serializers.py

from rest_framework import serializers
from django.utils import timezone
from .models import RendezVous
from prestations.models import ServiceOffert
from reprogrammations.serializers import ReprogrammationPropositionSerializer
from reprogrammations.services import create_reschedule_proposal, get_pending_proposal, mark_pending_reschedules
from vehicules.models import Vehicule
from planification.services import garage_has_active_slot, mecanicien_has_active_slot, mecanicien_has_conflict


class VehiculeSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicule
        fields = ['id', 'marque', 'modele', 'annee', 'vin', 'body_class', 'vehicle_type']


class ServiceSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceOffert
        fields = ['id', 'nom', 'description', 'duree_estimee', 'prix_indicatif']


class RendezVousSerializer(serializers.ModelSerializer):
    vehicle = VehiculeSummarySerializer(source='vehicule', read_only=True)
    symptomes = serializers.CharField(source='description', read_only=True)
    garage_name = serializers.CharField(source='garage.name', read_only=True)
    garage_slug = serializers.CharField(source='garage.slug', read_only=True)
    client_name = serializers.SerializerMethodField()
    client_email = serializers.EmailField(source='client.email', read_only=True)
    service_details = ServiceSummarySerializer(source='service', read_only=True)
    confirmed_by_name = serializers.SerializerMethodField()
    rejected_by_name = serializers.SerializerMethodField()
    reprogrammed_by_name = serializers.SerializerMethodField()
    reschedule_history = serializers.SerializerMethodField()
    has_pending_reschedule = serializers.SerializerMethodField()
    pending_reschedule_origin = serializers.SerializerMethodField()
    garage_internal_note = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = RendezVous
        fields = [
            'id',
            'garage',
            'garage_name',
            'garage_slug',
            'client',
            'client_name',
            'client_email',
            'mecanicien',
            'vehicule',
            'vehicle',
            'service',
            'service_details',
            'date',
            'requested_date',
            'status',
            'description',
            'symptomes',
            'estimatedTime',
            'quote',
            'reason',
            'confirmed_at',
            'confirmed_by',
            'confirmed_by_name',
            'rejected_at',
            'rejected_by',
            'rejected_by_name',
            'reprogrammed_at',
            'reprogrammed_by',
            'reprogrammed_by_name',
            'reschedule_history',
            'has_pending_reschedule',
            'pending_reschedule_origin',
            'garage_internal_note',
        ]
        read_only_fields = [
            'id',
            'client',
            'vehicle',
            'symptomes',
            'garage_name',
            'garage_slug',
            'client_name',
            'client_email',
            'service_details',
            'confirmed_at',
            'confirmed_by',
            'confirmed_by_name',
            'rejected_at',
            'rejected_by',
            'rejected_by_name',
            'reprogrammed_at',
            'reprogrammed_by',
            'reprogrammed_by_name',
            'reschedule_history',
            'has_pending_reschedule',
            'pending_reschedule_origin',
        ]
        extra_kwargs = {
            'mecanicien': {'required': False, 'allow_null': True},
            'vehicule': {'required': False, 'allow_null': True},
            'service': {'required': False, 'allow_null': True},
        }

    def get_client_name(self, obj):
        full_name = f"{obj.client.first_name or ''} {obj.client.last_name or ''}".strip()
        return full_name or obj.client.username

    def _format_actor_name(self, user):
        if not user:
            return None
        full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
        return full_name or user.username

    def get_confirmed_by_name(self, obj):
        return self._format_actor_name(obj.confirmed_by)

    def get_rejected_by_name(self, obj):
        return self._format_actor_name(obj.rejected_by)

    def get_reprogrammed_by_name(self, obj):
        return self._format_actor_name(obj.reprogrammed_by)

    def _can_view_internal_notes(self):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        role = getattr(getattr(user, 'profile', None), 'role', None)
        return user.is_superuser or role in {'owner', 'mecanicien'}

    def get_reschedule_history(self, obj):
        serializer = ReprogrammationPropositionSerializer(
            obj.reprogrammation_propositions.all(),
            many=True,
            context={'include_internal_notes': self._can_view_internal_notes()},
        )
        return serializer.data

    def get_has_pending_reschedule(self, obj):
        return get_pending_proposal(obj) is not None

    def get_pending_reschedule_origin(self, obj):
        pending = get_pending_proposal(obj)
        return pending.proposal_type if pending else None

    def validate_date(self, value):
        if value < timezone.now():
            raise serializers.ValidationError("La date du rendez-vous doit etre dans le futur.")
        return value

    def validate_requested_date(self, value):
        if value < timezone.now():
            raise serializers.ValidationError("La date demandee doit etre dans le futur.")
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        if request is None:
            return attrs

        user = request.user
        profile = getattr(user, 'profile', None)
        role = getattr(profile, 'role', None)
        user_garage = getattr(profile, 'garage', None)
        instance = self.instance

        garage = attrs.get('garage', getattr(instance, 'garage', None))
        mecanicien = attrs.get('mecanicien', getattr(instance, 'mecanicien', None))
        vehicule = attrs.get('vehicule', getattr(instance, 'vehicule', None))
        service = attrs.get('service', getattr(instance, 'service', None))
        date = attrs.get('date', getattr(instance, 'date', None))
        requested_date = attrs.get('requested_date', getattr(instance, 'requested_date', None))
        status = attrs.get('status', getattr(instance, 'status', 'pending'))
        estimated_time = attrs.get('estimatedTime')
        quote = attrs.get('quote')
        reason = attrs.get('reason')
        garage_internal_note = attrs.get('garage_internal_note')

        if garage is None:
            raise serializers.ValidationError({'garage': "Le garage du rendez-vous est requis."})

        if mecanicien and getattr(getattr(mecanicien, 'profile', None), 'role', None) != 'mecanicien':
            raise serializers.ValidationError({'mecanicien': "L'utilisateur choisi doit etre un mecanicien."})
        if mecanicien and getattr(getattr(mecanicien, 'profile', None), 'garage_id', None) != garage.id:
            raise serializers.ValidationError({'mecanicien': "Le mecanicien doit appartenir au meme garage."})
        if service and service.garage_id != garage.id:
            raise serializers.ValidationError({'service': "Le service choisi doit appartenir au garage."})

        if date is not None:
            if date < timezone.now():
                raise serializers.ValidationError({'date': "La date du rendez-vous doit etre dans le futur."})

        if vehicule and vehicule.owner_id != user.id and (instance is None or role == 'client'):
            raise serializers.ValidationError({'vehicule': "Vous ne pouvez utiliser qu'un vehicule qui vous appartient."})
        if instance is None:
            if role != 'client':
                raise serializers.ValidationError("Seul un client peut creer un rendez-vous.")
            if mecanicien is not None:
                raise serializers.ValidationError({'mecanicien': "Le client ne choisit pas le mecanicien. Le garage l'affectera en interne."})
            if vehicule is None:
                raise serializers.ValidationError({'vehicule': "Le vehicule concerne est requis."})
            if service is None:
                raise serializers.ValidationError({'service': "Le service demande est requis."})
            if status != 'pending':
                raise serializers.ValidationError({'status': "Un nouveau rendez-vous doit commencer a l'etat pending."})
            if estimated_time is not None or quote is not None or reason:
                raise serializers.ValidationError("Le client ne peut pas definir le devis, la duree estimee ou la raison.")
            return attrs

        if role == 'client':
            forbidden_fields = ['mecanicien', 'vehicule', 'service', 'estimatedTime', 'quote', 'reason', 'garage', 'date', 'garage_internal_note']
            for field in forbidden_fields:
                if field in attrs:
                    raise serializers.ValidationError({field: "Ce champ ne peut pas etre modifie par le client."})
            if 'status' in attrs and status not in {'cancelled', 'modification_requested'}:
                raise serializers.ValidationError({'status': "Le client peut seulement annuler ou demander une modification."})
            if status == 'modification_requested' and 'requested_date' not in attrs:
                raise serializers.ValidationError({'requested_date': "Une nouvelle date est requise pour demander une modification."})

        elif role in {'mecanicien', 'owner'}:
            forbidden_fields = ['client', 'vehicule', 'garage', 'service']
            if role == 'mecanicien':
                forbidden_fields.append('mecanicien')
            for field in forbidden_fields:
                if field in attrs:
                    actor = 'mecanicien' if role == 'mecanicien' else 'garage'
                    raise serializers.ValidationError({field: f"Ce champ ne peut pas etre modifie par le {actor}."})
            allowed_statuses = {'confirmed', 'rejected', 'done'}
            if 'status' in attrs and status not in allowed_statuses:
                actor = 'mecanicien' if role == 'mecanicien' else 'garage'
                raise serializers.ValidationError({'status': f"Le {actor} peut seulement confirmer, refuser ou terminer un rendez-vous."})
            if garage_internal_note and status not in {'confirmed', 'rejected'}:
                raise serializers.ValidationError({'garage_internal_note': "La note interne est reservee au traitement d'une reprogrammation."})
            has_estimated_time = 'estimatedTime' in attrs or getattr(instance, 'estimatedTime', None) is not None
            has_quote = 'quote' in attrs or getattr(instance, 'quote', None) is not None
            if status == 'confirmed' and (not has_estimated_time or not has_quote):
                raise serializers.ValidationError("La confirmation doit inclure une duree estimee et un devis.")
            if role == 'owner' and status == 'confirmed' and mecanicien is None:
                raise serializers.ValidationError({'mecanicien': "Le garage doit affecter un mecanicien lors de la confirmation."})
            effective_date = date
            if status == 'confirmed' and 'date' not in attrs and instance and instance.status == 'modification_requested' and requested_date:
                effective_date = requested_date
            if status == 'confirmed' and not garage_has_active_slot(garage, effective_date):
                raise serializers.ValidationError({'date': "Le rendez-vous confirme doit tomber dans une disponibilite active du garage."})
            if status == 'confirmed' and mecanicien is not None and not mecanicien_has_active_slot(mecanicien, effective_date):
                raise serializers.ValidationError({'mecanicien': "Ce mecanicien n'est pas disponible sur ce creneau."})
            if status == 'confirmed' and mecanicien_has_conflict(mecanicien, effective_date, instance):
                raise serializers.ValidationError({'mecanicien': "Ce mecanicien est deja affecte a un autre rendez-vous sur ce creneau."})
            if status == 'rejected' and not attrs.get('reason', getattr(instance, 'reason', '')):
                raise serializers.ValidationError({'reason': "Une raison est requise pour refuser un rendez-vous."})
            if instance and instance.garage_id != getattr(user_garage, 'id', None):
                actor = 'mecanicien' if role == 'mecanicien' else 'garage'
                raise serializers.ValidationError(f"Le {actor} ne peut agir que sur les rendez-vous de son garage.")

        elif not user.is_superuser:
            raise serializers.ValidationError("Role utilisateur non autorise pour cette action.")

        return attrs

    def update(self, instance, validated_data):
        request = self.context.get('request')
        actor = getattr(request, 'user', None)
        status = validated_data.get('status', instance.status)
        target_date = validated_data.get('date', instance.date)
        garage_internal_note = validated_data.pop('garage_internal_note', '').strip()

        if (
            status == 'confirmed'
            and 'date' not in validated_data
            and instance.status == 'modification_requested'
            and instance.requested_date
        ):
            validated_data['date'] = instance.requested_date
            target_date = instance.requested_date

        previous_date = instance.date
        previous_status = instance.status
        previous_requested_date = instance.requested_date

        if actor and status == 'confirmed':
            validated_data['confirmed_at'] = timezone.now()
            validated_data['confirmed_by'] = actor
            if previous_date and target_date and target_date != previous_date:
                validated_data['reprogrammed_at'] = timezone.now()
                validated_data['reprogrammed_by'] = actor

        if actor and status == 'rejected':
            validated_data['rejected_at'] = timezone.now()
            validated_data['rejected_by'] = actor

        if actor and status == 'modification_requested' and validated_data.get('requested_date'):
            mark_pending_reschedules(instance, actor, 'superseded')
            create_reschedule_proposal(
                instance,
                actor,
                proposal_type='client_request',
                proposed_date=validated_data['requested_date'],
                response_status='pending',
            )

        if actor and previous_status == 'modification_requested' and status == 'confirmed':
            accepted_requested_slot = previous_requested_date and target_date == previous_requested_date
            if accepted_requested_slot:
                mark_pending_reschedules(instance, actor, 'accepted', garage_internal_note)
            else:
                mark_pending_reschedules(instance, actor, 'rejected', garage_internal_note)
                if target_date and target_date != previous_date:
                    create_reschedule_proposal(
                        instance,
                        actor,
                        proposal_type='garage_counter',
                        proposed_date=target_date,
                        response_status='accepted',
                        note=garage_internal_note,
                    )

        if actor and previous_status == 'modification_requested' and status == 'rejected':
            mark_pending_reschedules(instance, actor, 'rejected', garage_internal_note)

        if actor and previous_status != 'modification_requested' and status == 'confirmed' and previous_date and target_date and target_date != previous_date:
            create_reschedule_proposal(
                instance,
                actor,
                proposal_type='garage_counter',
                proposed_date=target_date,
                response_status='accepted',
                note=garage_internal_note,
            )

        if actor and status in {'cancelled', 'done'}:
            mark_pending_reschedules(instance, actor, 'superseded', garage_internal_note)

        if status in {'confirmed', 'rejected', 'cancelled', 'done'}:
            validated_data['requested_date'] = None
        if previous_status == 'modification_requested' and status == 'confirmed' and previous_date == target_date:
            validated_data.setdefault('reprogrammed_at', instance.reprogrammed_at)
            validated_data.setdefault('reprogrammed_by', instance.reprogrammed_by)

        return super().update(instance, validated_data)
