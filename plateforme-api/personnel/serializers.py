from django.contrib.auth.models import User
from rest_framework import serializers

from comptes.validators import validate_unique_user_fields, validate_user_password
from personnel.models import MecanicienDisponibilite
from personnel.services import create_mecanicien_for_garage


class UserListSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)
    organization_id = serializers.IntegerField(source='profile.garage_id', read_only=True)
    specialites = serializers.CharField(source='profile.specialites', read_only=True)
    disponibilites_count = serializers.IntegerField(source='disponibilites.count', read_only=True)
    rdv_confirmed_count = serializers.IntegerField(read_only=True)
    rdv_today_count = serializers.IntegerField(read_only=True)
    rdv_upcoming_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'is_active',
            'role',
            'organization_id',
            'specialites',
            'disponibilites_count',
            'rdv_confirmed_count',
            'rdv_today_count',
            'rdv_upcoming_count',
        ]


class MecanicienCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    specialites = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'password', 'password2', 'specialites']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        validate_unique_user_fields(username=attrs.get('username'), email=attrs.get('email'))
        validate_user_password(attrs['password'])
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('password2')
        specialites = validated_data.pop('specialites', '')

        return create_mecanicien_for_garage(
            garage=self.context['garage'],
            password=password,
            specialites=specialites,
            **validated_data,
        )


class MecanicienUpdateSerializer(serializers.ModelSerializer):
    specialites = serializers.CharField(source='profile.specialites', required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'is_active', 'specialites']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()

        if 'specialites' in profile_data:
            instance.profile.specialites = profile_data['specialites']
            instance.profile.save()

        return instance


class MecanicienDisponibiliteSerializer(serializers.ModelSerializer):
    jour_label = serializers.CharField(source='get_jour_semaine_display', read_only=True)
    mecanicien_name = serializers.SerializerMethodField()

    class Meta:
        model = MecanicienDisponibilite
        fields = [
            'id',
            'mecanicien',
            'mecanicien_name',
            'jour_semaine',
            'jour_label',
            'heure_debut',
            'heure_fin',
            'actif',
        ]
        read_only_fields = ['id', 'jour_label', 'mecanicien_name']

    def get_mecanicien_name(self, obj):
        full_name = f"{obj.mecanicien.first_name or ''} {obj.mecanicien.last_name or ''}".strip()
        return full_name or obj.mecanicien.username

    def validate(self, attrs):
        request = self.context.get('request')
        mecanicien = attrs.get('mecanicien', getattr(self.instance, 'mecanicien', None))

        if mecanicien is None:
            raise serializers.ValidationError({'mecanicien': "L'employe est requis."})

        if getattr(getattr(mecanicien, 'profile', None), 'role', None) != 'employe':
            raise serializers.ValidationError({'mecanicien': "L'utilisateur choisi doit etre un employe."})

        owner_garage = getattr(getattr(request.user, 'profile', None), 'garage', None) if request else None
        if getattr(getattr(mecanicien, 'profile', None), 'garage_id', None) != getattr(owner_garage, 'id', None):
            raise serializers.ValidationError({'mecanicien': "L'employe doit appartenir a votre etablissement."})

        heure_debut = attrs.get('heure_debut', getattr(self.instance, 'heure_debut', None))
        heure_fin = attrs.get('heure_fin', getattr(self.instance, 'heure_fin', None))
        jour_semaine = attrs.get('jour_semaine', getattr(self.instance, 'jour_semaine', None))
        actif = attrs.get('actif', getattr(self.instance, 'actif', True))
        if heure_debut and heure_fin and heure_debut >= heure_fin:
            raise serializers.ValidationError({'heure_fin': "L'heure de fin doit etre apres l'heure de debut."})

        if actif and mecanicien and jour_semaine is not None and heure_debut and heure_fin:
            queryset = MecanicienDisponibilite.objects.filter(
                mecanicien=mecanicien,
                jour_semaine=jour_semaine,
                actif=True,
            )
            if self.instance is not None:
                queryset = queryset.exclude(pk=self.instance.pk)
            overlap = queryset.filter(
                heure_debut__lt=heure_fin,
                heure_fin__gt=heure_debut,
            ).exists()
            if overlap:
                raise serializers.ValidationError(
                    "Ce creneau chevauche deja une autre disponibilite active pour cet employe."
                )

        return attrs
