# users/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile
from garages.models import Garage
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


# == SERIALIZER DE CRÉATION D'UTILISATEUR ==
class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)
    role = serializers.CharField(write_only=True)
    garage_id = serializers.PrimaryKeyRelatedField(
        queryset=Garage.objects.all(),
        source='profile.garage',
        write_only=True,
        required=False,
        allow_null=True,
    )
    date_naissance = serializers.DateField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'password', 'password2', 'role', 'garage_id', 'date_naissance'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return attrs

    def create(self, validated_data):
        """
        Crée un User + Profile associé.
        """
        password = validated_data.pop('password')
        validated_data.pop('password2')
        role = validated_data.pop('role')
        profile_data = validated_data.pop('profile', {})
        garage = profile_data.get('garage')
        date_naissance = validated_data.pop('date_naissance', None)

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        # Mise à jour / création du profil
        profile = user.profile  # créé via signal (si configuré)
        profile.role = role if role in ['owner', 'client', 'mecanicien'] else 'client'
        if garage is not None:
            profile.garage = garage
        if date_naissance:
            profile.date_naissance = date_naissance
        profile.save()

        return user


# == SERIALIZER DE PROFIL (LECTURE) ==
class ProfileSerializer(serializers.ModelSerializer):
    """
    Affiche le user.username, user.email, etc. en lecture seule.
    """
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    garage_id = serializers.IntegerField(source='garage.id', read_only=True)
    garage_name = serializers.CharField(source='garage.name', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'garage_id',
            'garage_name',
            'date_naissance',
        ]


# == SERIALIZER DE MISE À JOUR UTILISATEUR ==
class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Met à jour first_name, last_name (User),
    et role, date_naissance (Profile).
    """
    role = serializers.CharField(write_only=True, required=False)
    garage_id = serializers.PrimaryKeyRelatedField(
        queryset=Garage.objects.all(),
        source='profile.garage',
        write_only=True,
        required=False,
        allow_null=True,
    )
    date_naissance = serializers.DateField(write_only=True, required=False)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'role', 'garage_id', 'date_naissance']

    def update(self, instance, validated_data):
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        email = validated_data.pop('email', None)
        role = validated_data.pop('role', None)
        profile_data = validated_data.pop('profile', {})
        garage = profile_data.get('garage') if profile_data else None
        date_naissance = validated_data.pop('date_naissance', None)

        # Mettre à jour l'utilisateur
        if first_name is not None:
            instance.first_name = first_name
        if last_name is not None:
            instance.last_name = last_name
        if email is not None:
            instance.email = email
        instance.save()

        # Mettre à jour le profil
        profile = instance.profile
        if role is not None:
            profile.role = role if role in ['owner', 'client', 'mecanicien'] else profile.role
        if garage is not None:
            profile.garage = garage
        if date_naissance is not None:
            profile.date_naissance = date_naissance
        profile.save()

        return instance


# == SERIALIZER POUR SIMPLEJWT (TOKEN) ==
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Personnalise SimpleJWT pour inclure le champ 'role' 
    dans la payload du token et la réponse.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = getattr(user.profile, 'role', 'client')
        token['garage_id'] = getattr(user.profile, 'garage_id', None)
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = getattr(self.user.profile, 'role', 'client')
        data['garage_id'] = getattr(self.user.profile, 'garage_id', None)
        return data


# == (NOUVEAU) SERIALIZER DE LISTE USER / MECANICIENS ==
class UserListSerializer(serializers.ModelSerializer):
    """
    Sert à lister les utilisateurs (affichant role, username, etc.)
    """
    role = serializers.CharField(source='profile.role', read_only=True)
    garage_id = serializers.IntegerField(source='profile.garage_id', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'garage_id']


# -- Optionnel: Un Serializer plus complet pour le CRUD d'un user --
# class UserCRUDSerializer(serializers.ModelSerializer):
#     ...
