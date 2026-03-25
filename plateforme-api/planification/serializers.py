from rest_framework import serializers

from planification.models import DisponibiliteGarage, FermetureExceptionnelleGarage
from planification.services import get_current_user_garage


class DisponibiliteGarageSerializer(serializers.ModelSerializer):
    jour_label = serializers.CharField(source='get_jour_semaine_display', read_only=True)

    class Meta:
        model = DisponibiliteGarage
        fields = ['id', 'jour_semaine', 'jour_label', 'heure_debut', 'heure_fin', 'actif']
        read_only_fields = ['id', 'jour_label']

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        jour_semaine = attrs.get('jour_semaine', getattr(instance, 'jour_semaine', None))
        heure_debut = attrs.get('heure_debut', getattr(instance, 'heure_debut', None))
        heure_fin = attrs.get('heure_fin', getattr(instance, 'heure_fin', None))
        actif = attrs.get('actif', getattr(instance, 'actif', True))

        if heure_debut is None or heure_fin is None:
            raise serializers.ValidationError("Les heures de debut et de fin sont requises.")
        if heure_fin <= heure_debut:
            raise serializers.ValidationError({'heure_fin': "L'heure de fin doit etre apres l'heure de debut."})

        request = self.context.get('request')
        current_garage = get_current_user_garage(getattr(request, 'user', None))
        if current_garage is not None and actif:
            queryset = DisponibiliteGarage.objects.filter(
                garage=current_garage,
                jour_semaine=jour_semaine,
                actif=True,
            )
            if instance is not None:
                queryset = queryset.exclude(pk=instance.pk)
            overlap = queryset.filter(
                heure_debut__lt=heure_fin,
                heure_fin__gt=heure_debut,
            ).exists()
            if overlap:
                raise serializers.ValidationError("Ce creneau chevauche deja une autre disponibilite active du meme jour.")

        return attrs


class FermetureExceptionnelleGarageSerializer(serializers.ModelSerializer):
    class Meta:
        model = FermetureExceptionnelleGarage
        fields = ['id', 'date', 'toute_la_journee', 'heure_debut', 'heure_fin', 'raison', 'actif']
        read_only_fields = ['id']

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        date = attrs.get('date', getattr(instance, 'date', None))
        toute_la_journee = attrs.get('toute_la_journee', getattr(instance, 'toute_la_journee', True))
        heure_debut = attrs.get('heure_debut', getattr(instance, 'heure_debut', None))
        heure_fin = attrs.get('heure_fin', getattr(instance, 'heure_fin', None))
        actif = attrs.get('actif', getattr(instance, 'actif', True))

        if not toute_la_journee:
            if heure_debut is None or heure_fin is None:
                raise serializers.ValidationError("Une fermeture partielle doit definir une heure de debut et une heure de fin.")
            if heure_fin <= heure_debut:
                raise serializers.ValidationError({'heure_fin': "L'heure de fin doit etre apres l'heure de debut."})
        else:
            attrs['heure_debut'] = None
            attrs['heure_fin'] = None

        request = self.context.get('request')
        current_garage = get_current_user_garage(getattr(request, 'user', None))
        if current_garage is not None and actif:
            queryset = FermetureExceptionnelleGarage.objects.filter(
                garage=current_garage,
                date=date,
                actif=True,
            )
            if instance is not None:
                queryset = queryset.exclude(pk=instance.pk)
            if toute_la_journee and queryset.exists():
                raise serializers.ValidationError("Une fermeture toute la journee existe deja pour cette date.")
            if queryset.filter(toute_la_journee=True).exists():
                raise serializers.ValidationError("Cette date est deja fermee toute la journee.")
            if not toute_la_journee:
                overlap = queryset.filter(
                    heure_debut__lt=heure_fin,
                    heure_fin__gt=heure_debut,
                ).exists()
                if overlap:
                    raise serializers.ValidationError("Cette fermeture exceptionnelle chevauche deja un autre bloc.")

        return attrs
