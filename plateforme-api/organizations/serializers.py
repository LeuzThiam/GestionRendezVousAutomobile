from django.contrib.auth.models import User
from django.utils.text import slugify
from rest_framework import serializers

from comptes.services import assign_profile, create_basic_user
from comptes.validators import validate_unique_user_fields
from planification.serializers import DisponibiliteGarageSerializer, FermetureExceptionnelleGarageSerializer
from prestations.serializers import PublicServiceOffertSerializer
from .models import Organization


class PublicEmployeSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()


class OrganizationSerializer(serializers.ModelSerializer):
    owner_id = serializers.IntegerField(source='owner.id', read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Organization
        fields = [
            'id',
            'name',
            'slug',
            'type_etablissement',
            'phone',
            'address',
            'description',
            'is_active',
            'owner_id',
            'owner_username',
            'created_at',
        ]
        read_only_fields = ['id', 'slug', 'is_active', 'owner_id', 'owner_username', 'created_at']


class PublicOrganizationSerializer(serializers.ModelSerializer):
    employes = serializers.SerializerMethodField()
    services = serializers.SerializerMethodField()
    disponibilites = serializers.SerializerMethodField()
    fermetures_exceptionnelles = serializers.SerializerMethodField()
    type_etablissement_label = serializers.CharField(source='get_type_etablissement_display', read_only=True)

    class Meta:
        model = Organization
        fields = [
            'id',
            'name',
            'slug',
            'type_etablissement',
            'type_etablissement_label',
            'phone',
            'address',
            'description',
            'employes',
            'services',
            'disponibilites',
            'fermetures_exceptionnelles',
        ]

    def get_employes(self, obj):
        employes = User.objects.filter(profile__role='employe', profile__garage=obj).values(
            'id',
            'first_name',
            'last_name',
        )
        return PublicEmployeSerializer(employes, many=True).data

    def get_services(self, obj):
        services = obj.services.filter(actif=True)
        return PublicServiceOffertSerializer(services, many=True).data

    def get_disponibilites(self, obj):
        disponibilites = obj.disponibilites.filter(actif=True)
        return DisponibiliteGarageSerializer(disponibilites, many=True).data

    def get_fermetures_exceptionnelles(self, obj):
        fermetures = obj.fermetures_exceptionnelles.filter(actif=True)
        return FermetureExceptionnelleGarageSerializer(fermetures, many=True).data


class PublicOrganizationListSerializer(serializers.ModelSerializer):
    employes_count = serializers.IntegerField(read_only=True)
    services = serializers.SerializerMethodField()
    disponibilites_count = serializers.SerializerMethodField()
    type_etablissement_label = serializers.CharField(source='get_type_etablissement_display', read_only=True)

    class Meta:
        model = Organization
        fields = [
            'id',
            'name',
            'slug',
            'type_etablissement',
            'type_etablissement_label',
            'phone',
            'address',
            'description',
            'employes_count',
            'services',
            'disponibilites_count',
        ]

    def get_services(self, obj):
        return list(obj.services.filter(actif=True).values_list('nom', flat=True))

    def get_disponibilites_count(self, obj):
        return obj.disponibilites.filter(actif=True).count()


class OrganizationRegistrationSerializer(serializers.Serializer):
    organization_name = serializers.CharField(max_length=150)
    organization_slug = serializers.SlugField(max_length=160, required=False, allow_blank=True)
    garage_slug = serializers.SlugField(max_length=160, required=False, allow_blank=True, write_only=True)
    type_etablissement = serializers.ChoiceField(
        choices=Organization.TYPE_ETABLISSEMENT_CHOICES,
        default='multi_services',
        required=False,
    )
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
        garage_slug = (attrs.pop('garage_slug', '') or '').strip()
        org_slug = (attrs.get('organization_slug') or '').strip()
        if garage_slug and not org_slug:
            attrs['organization_slug'] = garage_slug

        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")

        validate_unique_user_fields(username=attrs.get('username'), email=attrs.get('email'))
        return attrs

    def create(self, validated_data):
        org_name = validated_data.pop('organization_name')
        org_slug = (validated_data.pop('organization_slug', '') or '').strip() or None
        type_etablissement = validated_data.pop('type_etablissement')
        phone = validated_data.pop('phone', '') or ''
        address = validated_data.pop('address', '') or ''
        description = validated_data.pop('description', '') or ''
        password = validated_data.pop('password')
        validated_data.pop('password2')

        user = create_basic_user(password=password, **validated_data)

        if not org_slug:
            org_slug = slugify(org_name)
        base_slug = org_slug
        n = 1
        while Organization.objects.filter(slug=org_slug).exists():
            org_slug = f'{base_slug}-{n}'
            n += 1

        org = Organization.objects.create(
            name=org_name,
            slug=org_slug,
            type_etablissement=type_etablissement,
            owner=user,
            phone=phone,
            address=address,
            description=description,
        )
        assign_profile(user, role='owner', garage=org)
        return user

    def to_representation(self, instance):
        from comptes.auth_serializers import AuthUserSerializer

        return AuthUserSerializer(instance).data
