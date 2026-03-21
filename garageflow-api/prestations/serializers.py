from decimal import Decimal
from rest_framework import serializers

from prestations.models import ServiceOffert


class PublicServiceOffertSerializer(serializers.ModelSerializer):
    categorie_label = serializers.CharField(source='get_categorie_display', read_only=True)

    class Meta:
        model = ServiceOffert
        fields = ['id', 'nom', 'categorie', 'categorie_label', 'description', 'duree_estimee', 'prix_indicatif', 'ordre_affichage']


class ServiceOffertSerializer(serializers.ModelSerializer):
    categorie_label = serializers.CharField(source='get_categorie_display', read_only=True)

    class Meta:
        model = ServiceOffert
        fields = ['id', 'nom', 'categorie', 'categorie_label', 'description', 'duree_estimee', 'prix_indicatif', 'ordre_affichage', 'actif']
        read_only_fields = ['id']

    def validate_duree_estimee(self, value):
        if value is None:
            raise serializers.ValidationError("La duree estimee est requise.")
        if value <= 0:
            raise serializers.ValidationError("La duree estimee doit etre superieure a zero.")
        if value < Decimal('0.25'):
            raise serializers.ValidationError("La duree estimee minimale est de 0.25 h.")
        if value > Decimal('12.00'):
            raise serializers.ValidationError("La duree estimee doit rester coherente.")
        return value

    def validate_prix_indicatif(self, value):
        if value is None:
            raise serializers.ValidationError("Le prix indicatif est requis.")
        if value < 0:
            raise serializers.ValidationError("Le prix indicatif ne peut pas etre negatif.")
        return value

    def validate_ordre_affichage(self, value):
        if value < 0:
            raise serializers.ValidationError("L'ordre d'affichage doit etre positif.")
        return value

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        duree_estimee = attrs.get('duree_estimee', getattr(instance, 'duree_estimee', None))
        prix_indicatif = attrs.get('prix_indicatif', getattr(instance, 'prix_indicatif', None))
        errors = {}

        if duree_estimee is None:
            errors['duree_estimee'] = "La duree estimee est requise."
        if prix_indicatif is None:
            errors['prix_indicatif'] = "Le prix indicatif est requis."
        if errors:
            raise serializers.ValidationError(errors)

        return attrs

