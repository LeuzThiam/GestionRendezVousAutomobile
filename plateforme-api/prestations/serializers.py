from decimal import Decimal

from rest_framework import serializers

from prestations.models import CategoriePrestation, ServiceOffert


class CategoriePrestationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriePrestation
        fields = ['id', 'nom', 'slug', 'ordre', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']

    def validate_nom(self, value):
        text = (value or '').strip()
        if not text:
            raise serializers.ValidationError("Le nom est requis.")
        return text

    def validate_ordre(self, value):
        if value < 0:
            raise serializers.ValidationError("L ordre doit etre positif.")
        return value


class PublicServiceOffertSerializer(serializers.ModelSerializer):
    categorie_label = serializers.CharField(source='categorie.nom', read_only=True)
    categorie_slug = serializers.CharField(source='categorie.slug', read_only=True)

    class Meta:
        model = ServiceOffert
        fields = [
            'id',
            'nom',
            'categorie',
            'categorie_label',
            'categorie_slug',
            'description',
            'duree_estimee',
            'prix_indicatif',
            'ordre_affichage',
        ]


class ServiceOffertSerializer(serializers.ModelSerializer):
    categorie_label = serializers.CharField(source='categorie.nom', read_only=True)
    categorie_slug = serializers.CharField(source='categorie.slug', read_only=True)

    class Meta:
        model = ServiceOffert
        fields = [
            'id',
            'nom',
            'categorie',
            'categorie_label',
            'categorie_slug',
            'description',
            'duree_estimee',
            'prix_indicatif',
            'ordre_affichage',
            'actif',
        ]
        read_only_fields = ['id']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            garage = getattr(request.user.profile, 'garage', None)
            if garage is not None:
                self.fields['categorie'].queryset = CategoriePrestation.objects.filter(garage=garage)

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
            raise serializers.ValidationError("L ordre d affichage doit etre positif.")
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

        request = self.context.get('request')
        garage = getattr(request.user.profile, 'garage', None) if request and request.user.is_authenticated else None
        categorie = attrs.get('categorie') or (instance.categorie if instance else None)
        if garage and categorie and categorie.garage_id != garage.id:
            raise serializers.ValidationError({'categorie': 'Categorie invalide pour cet etablissement.'})

        return attrs
