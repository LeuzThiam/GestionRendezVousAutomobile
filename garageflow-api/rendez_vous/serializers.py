# rendez_vous/serializers.py

from rest_framework import serializers
from django.utils import timezone
from .models import RendezVous
from vehicules.models import Vehicule


class VehiculeSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicule
        fields = ['id', 'marque', 'modele', 'annee', 'vin', 'body_class', 'vehicle_type']


class RendezVousSerializer(serializers.ModelSerializer):
    vehicle = VehiculeSummarySerializer(source='vehicule', read_only=True)
    symptomes = serializers.CharField(source='description', read_only=True)

    class Meta:
        model = RendezVous
        fields = [
            'id',
            'garage',
            'client',
            'mecanicien',
            'vehicule',
            'vehicle',
            'date',
            'status',
            'description',
            'symptomes',
            'estimatedTime',
            'quote',
            'reason',
        ]
        read_only_fields = [
            'id',
            'garage',
            'client',
            'vehicle',
            'symptomes',
        ]

    def validate_date(self, value):
        if value < timezone.now():
            raise serializers.ValidationError("La date du rendez-vous doit etre dans le futur.")
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

        mecanicien = attrs.get('mecanicien', getattr(instance, 'mecanicien', None))
        vehicule = attrs.get('vehicule', getattr(instance, 'vehicule', None))
        date = attrs.get('date', getattr(instance, 'date', None))
        status = attrs.get('status', getattr(instance, 'status', 'pending'))
        estimated_time = attrs.get('estimatedTime')
        quote = attrs.get('quote')
        reason = attrs.get('reason')

        if user_garage is None and not user.is_superuser:
            raise serializers.ValidationError("L'utilisateur doit appartenir a un garage.")

        if mecanicien and getattr(getattr(mecanicien, 'profile', None), 'role', None) != 'mecanicien':
            raise serializers.ValidationError({'mecanicien': "L'utilisateur choisi doit etre un mecanicien."})
        if mecanicien and getattr(getattr(mecanicien, 'profile', None), 'garage_id', None) != getattr(user_garage, 'id', None):
            raise serializers.ValidationError({'mecanicien': "Le mecanicien doit appartenir au meme garage."})

        if date is not None:
            if date < timezone.now():
                raise serializers.ValidationError({'date': "La date du rendez-vous doit etre dans le futur."})

        if vehicule and vehicule.owner_id != user.id and (instance is None or role == 'client'):
            raise serializers.ValidationError({'vehicule': "Vous ne pouvez utiliser qu'un vehicule qui vous appartient."})
        if vehicule and vehicule.garage_id != getattr(user_garage, 'id', None):
            raise serializers.ValidationError({'vehicule': "Le vehicule doit appartenir au meme garage."})

        if instance is None:
            if role != 'client':
                raise serializers.ValidationError("Seul un client peut creer un rendez-vous.")
            if status != 'pending':
                raise serializers.ValidationError({'status': "Un nouveau rendez-vous doit commencer a l'etat pending."})
            if estimated_time is not None or quote is not None or reason:
                raise serializers.ValidationError("Le client ne peut pas definir le devis, la duree estimee ou la raison.")
            return attrs

        if role == 'client':
            forbidden_fields = ['mecanicien', 'vehicule', 'estimatedTime', 'quote', 'reason']
            for field in forbidden_fields:
                if field in attrs:
                    raise serializers.ValidationError({field: "Ce champ ne peut pas etre modifie par le client."})
            if 'status' in attrs and status not in {'cancelled', 'modification_requested'}:
                raise serializers.ValidationError({'status': "Le client peut seulement annuler ou demander une modification."})
            if status == 'modification_requested' and 'date' not in attrs:
                raise serializers.ValidationError({'date': "Une nouvelle date est requise pour demander une modification."})

        elif role == 'mecanicien':
            forbidden_fields = ['client', 'mecanicien', 'vehicule']
            for field in forbidden_fields:
                if field in attrs:
                    raise serializers.ValidationError({field: "Ce champ ne peut pas etre modifie par le mecanicien."})
            allowed_statuses = {'confirmed', 'rejected', 'done'}
            if 'status' in attrs and status not in allowed_statuses:
                raise serializers.ValidationError({'status': "Le mecanicien peut seulement confirmer, refuser ou terminer un rendez-vous."})
            if status == 'confirmed' and ('estimatedTime' not in attrs or 'quote' not in attrs):
                raise serializers.ValidationError("La confirmation doit inclure une duree estimee et un devis.")
            if status == 'rejected' and not attrs.get('reason', getattr(instance, 'reason', '')):
                raise serializers.ValidationError({'reason': "Une raison est requise pour refuser un rendez-vous."})
            if instance and instance.garage_id != getattr(user_garage, 'id', None):
                raise serializers.ValidationError("Le mecanicien ne peut agir que sur les rendez-vous de son garage.")

        elif not user.is_superuser:
            raise serializers.ValidationError("Role utilisateur non autorise pour cette action.")

        return attrs
