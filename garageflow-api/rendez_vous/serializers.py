# rendez_vous/serializers.py

from rest_framework import serializers
from django.utils import timezone
from .models import RendezVous
from vehicules.models import Vehicule
from garages.models import DisponibiliteGarage, ServiceOffert
from users.models import MecanicienDisponibilite


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
        ]
        extra_kwargs = {
            'mecanicien': {'required': False, 'allow_null': True},
            'vehicule': {'required': False, 'allow_null': True},
            'service': {'required': False, 'allow_null': True},
        }

    def get_client_name(self, obj):
        full_name = f"{obj.client.first_name or ''} {obj.client.last_name or ''}".strip()
        return full_name or obj.client.username

    def _date_is_within_garage_availability(self, garage, date):
        if garage is None or date is None:
            return False
        local_date = timezone.localtime(date)
        weekday = local_date.weekday()
        current_time = local_date.time().replace(second=0, microsecond=0)
        return DisponibiliteGarage.objects.filter(
            garage=garage,
            actif=True,
            jour_semaine=weekday,
            heure_debut__lte=current_time,
            heure_fin__gte=current_time,
        ).exists()

    def _mecanicien_has_conflict(self, mecanicien, date, instance):
        if mecanicien is None or date is None:
            return False
        queryset = RendezVous.objects.filter(
            mecanicien=mecanicien,
            date=date,
            status='confirmed',
        )
        if instance is not None:
            queryset = queryset.exclude(pk=instance.pk)
        return queryset.exists()

    def _date_is_within_mecanicien_availability(self, mecanicien, date):
        if mecanicien is None or date is None:
            return False

        local_date = timezone.localtime(date)
        weekday = local_date.weekday()
        current_time = local_date.time().replace(second=0, microsecond=0)
        disponibilites = MecanicienDisponibilite.objects.filter(
            mecanicien=mecanicien,
            actif=True,
        )

        if not disponibilites.exists():
            return True

        return disponibilites.filter(
            jour_semaine=weekday,
            heure_debut__lte=current_time,
            heure_fin__gte=current_time,
        ).exists()

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
            forbidden_fields = ['mecanicien', 'vehicule', 'service', 'estimatedTime', 'quote', 'reason', 'garage', 'date']
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
            has_estimated_time = 'estimatedTime' in attrs or getattr(instance, 'estimatedTime', None) is not None
            has_quote = 'quote' in attrs or getattr(instance, 'quote', None) is not None
            if status == 'confirmed' and (not has_estimated_time or not has_quote):
                raise serializers.ValidationError("La confirmation doit inclure une duree estimee et un devis.")
            if role == 'owner' and status == 'confirmed' and mecanicien is None:
                raise serializers.ValidationError({'mecanicien': "Le garage doit affecter un mecanicien lors de la confirmation."})
            effective_date = date
            if status == 'confirmed' and 'date' not in attrs and instance and instance.status == 'modification_requested' and requested_date:
                effective_date = requested_date
            if status == 'confirmed' and not self._date_is_within_garage_availability(garage, effective_date):
                raise serializers.ValidationError({'date': "Le rendez-vous confirme doit tomber dans une disponibilite active du garage."})
            if status == 'confirmed' and mecanicien is not None and not self._date_is_within_mecanicien_availability(mecanicien, effective_date):
                raise serializers.ValidationError({'mecanicien': "Ce mecanicien n'est pas disponible sur ce creneau."})
            if status == 'confirmed' and self._mecanicien_has_conflict(mecanicien, effective_date, instance):
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
        status = validated_data.get('status', instance.status)

        if (
            status == 'confirmed'
            and 'date' not in validated_data
            and instance.status == 'modification_requested'
            and instance.requested_date
        ):
            validated_data['date'] = instance.requested_date

        if status in {'confirmed', 'rejected', 'cancelled', 'done'}:
            validated_data['requested_date'] = None

        return super().update(instance, validated_data)
