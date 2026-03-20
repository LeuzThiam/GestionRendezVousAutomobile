from django.contrib.auth.models import User
from rest_framework import serializers
from django.utils.text import slugify

from .models import Garage, ServiceOffert, DisponibiliteGarage


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

    class Meta:
        model = Garage
        fields = ['id', 'name', 'slug', 'phone', 'address', 'mecaniciens', 'services', 'disponibilites']

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
            'mecaniciens_count',
            'services',
            'disponibilites_count',
        ]

    def get_services(self, obj):
        return list(obj.services.filter(actif=True).values_list('nom', flat=True))

    def get_disponibilites_count(self, obj):
        return obj.disponibilites.filter(actif=True).count()


class PublicServiceOffertSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceOffert
        fields = ['id', 'nom', 'description', 'duree_estimee', 'prix_indicatif']


class ServiceOffertSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceOffert
        fields = ['id', 'nom', 'description', 'duree_estimee', 'prix_indicatif', 'actif']
        read_only_fields = ['id']


class DisponibiliteGarageSerializer(serializers.ModelSerializer):
    jour_label = serializers.CharField(source='get_jour_semaine_display', read_only=True)

    class Meta:
        model = DisponibiliteGarage
        fields = ['id', 'jour_semaine', 'jour_label', 'heure_debut', 'heure_fin', 'actif']
        read_only_fields = ['id', 'jour_label']


class GarageRegistrationSerializer(serializers.Serializer):
    garage_name = serializers.CharField(max_length=150)
    garage_slug = serializers.SlugField(max_length=160, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    address = serializers.CharField(max_length=255, required=False, allow_blank=True)
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
        )

        profile = user.profile
        profile.role = 'owner'
        profile.garage = garage
        profile.save()

        return garage

    def to_representation(self, instance):
        return GarageSerializer(instance).data
