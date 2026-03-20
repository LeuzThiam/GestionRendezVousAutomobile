from django.contrib.auth.models import User
from decimal import Decimal
from rest_framework import serializers
from django.utils.text import slugify

from .models import Garage, ServiceOffert, DisponibiliteGarage, FermetureExceptionnelleGarage


class PublicMecanicienSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()


class GarageSerializer(serializers.ModelSerializer):
    owner_id = serializers.IntegerField(source='owner.id', read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Garage
        fields = [
            'id',
            'name',
            'slug',
            'phone',
            'address',
            'description',
            'is_active',
            'owner_id',
            'owner_username',
            'created_at',
        ]
        read_only_fields = ['id', 'slug', 'is_active', 'owner_id', 'owner_username', 'created_at']


class PublicGarageSerializer(serializers.ModelSerializer):
    mecaniciens = serializers.SerializerMethodField()
    services = serializers.SerializerMethodField()
    disponibilites = serializers.SerializerMethodField()
    fermetures_exceptionnelles = serializers.SerializerMethodField()

    class Meta:
        model = Garage
        fields = ['id', 'name', 'slug', 'phone', 'address', 'description', 'mecaniciens', 'services', 'disponibilites', 'fermetures_exceptionnelles']

    def get_mecaniciens(self, obj):
        mecaniciens = User.objects.filter(profile__role='mecanicien', profile__garage=obj).values(
            'id',
            'first_name',
            'last_name',
        )
        return PublicMecanicienSerializer(mecaniciens, many=True).data

    def get_services(self, obj):
        services = obj.services.filter(actif=True)
        return PublicServiceOffertSerializer(services, many=True).data

    def get_disponibilites(self, obj):
        disponibilites = obj.disponibilites.filter(actif=True)
        return DisponibiliteGarageSerializer(disponibilites, many=True).data

    def get_fermetures_exceptionnelles(self, obj):
        fermetures = obj.fermetures_exceptionnelles.filter(actif=True)
        return FermetureExceptionnelleGarageSerializer(fermetures, many=True).data


class PublicGarageListSerializer(serializers.ModelSerializer):
    mecaniciens_count = serializers.IntegerField(read_only=True)
    services = serializers.SerializerMethodField()
    disponibilites_count = serializers.SerializerMethodField()

    class Meta:
        model = Garage
        fields = [
            'id',
            'name',
            'slug',
            'phone',
            'address',
            'description',
            'mecaniciens_count',
            'services',
            'disponibilites_count',
        ]

    def get_services(self, obj):
        return list(obj.services.filter(actif=True).values_list('nom', flat=True))

    def get_disponibilites_count(self, obj):
        return obj.disponibilites.filter(actif=True).count()


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
        current_garage = getattr(getattr(getattr(request, 'user', None), 'profile', None), 'garage', None)
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
        current_garage = getattr(getattr(getattr(request, 'user', None), 'profile', None), 'garage', None)
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


class GarageRegistrationSerializer(serializers.Serializer):
    garage_name = serializers.CharField(max_length=150)
    garage_slug = serializers.SlugField(max_length=160, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    address = serializers.CharField(max_length=255, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({'username': "Ce nom d'utilisateur existe deja."})
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({'email': "Cette adresse courriel existe deja."})
        if Garage.objects.filter(name=attrs['garage_name']).exists():
            raise serializers.ValidationError({'garage_name': "Un garage avec ce nom existe deja."})
        garage_slug = attrs.get('garage_slug') or slugify(attrs['garage_name'])
        if Garage.objects.filter(slug=garage_slug).exists():
            raise serializers.ValidationError({'garage_slug': "Ce slug de garage existe deja."})
        return attrs

    def create(self, validated_data):
        garage_name = validated_data.pop('garage_name')
        garage_slug = validated_data.pop('garage_slug', '')
        phone = validated_data.pop('phone', '')
        address = validated_data.pop('address', '')
        description = validated_data.pop('description', '')
        password = validated_data.pop('password')
        validated_data.pop('password2')

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        garage = Garage.objects.create(
            name=garage_name,
            slug=garage_slug or slugify(garage_name),
            owner=user,
            phone=phone,
            address=address,
            description=description,
        )

        profile = user.profile
        profile.role = 'owner'
        profile.garage = garage
        profile.save()

        return garage

    def to_representation(self, instance):
        return GarageSerializer(instance).data
