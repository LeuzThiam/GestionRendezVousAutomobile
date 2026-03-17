# users/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Profile
from garages.models import Garage
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .services import (
    assign_profile,
    create_mecanicien_for_garage,
    create_basic_user,
    normalize_profile_role,
    update_user_and_profile,
)
from garages.serializers import GarageRegistrationSerializer


def validate_unique_user_fields(*, username=None, email=None):
    if username and User.objects.filter(username=username).exists():
        raise serializers.ValidationError({'username': "Ce nom d'utilisateur existe deja."})
    if email and User.objects.filter(email=email).exists():
        raise serializers.ValidationError({'email': "Cette adresse courriel existe deja."})


def validate_user_password(password, user=None):
    try:
        validate_password(password, user=user)
    except Exception as exc:
        messages = []
        if hasattr(exc, 'messages'):
            messages = exc.messages
        elif hasattr(exc, 'error_list'):
            messages = [str(item) for item in exc.error_list]
        else:
            messages = [str(exc)]
        raise serializers.ValidationError({'password': messages})


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
        validate_unique_user_fields(username=attrs.get('username'), email=attrs.get('email'))
        validate_user_password(attrs['password'])
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

        user = create_basic_user(password=password, **validated_data)
        assign_profile(
            user,
            role=normalize_profile_role(role),
            garage=garage,
            date_naissance=date_naissance,
        )

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

        return update_user_and_profile(
            instance,
            first_name=first_name,
            last_name=last_name,
            email=email,
            role=role,
            garage=garage,
            date_naissance=date_naissance,
        )


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


class AuthUserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)
    garage_id = serializers.IntegerField(source='profile.garage_id', read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'garage_id',
        ]


class AuthLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    default_error_messages = {
        'invalid_credentials': 'Identifiants invalides.',
    }

    def validate(self, attrs):
        email = attrs['email'].strip().lower()
        password = attrs['password']

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            self.fail('invalid_credentials')

        if not user.check_password(password):
            self.fail('invalid_credentials')

        if not user.is_active:
            self.fail('invalid_credentials')

        refresh = RefreshToken.for_user(user)
        attrs['user'] = user
        attrs['access'] = str(refresh.access_token)
        attrs['refresh'] = str(refresh)
        return attrs

    def to_representation(self, instance):
        user = instance['user']
        return {
            'access': instance['access'],
            'refresh': instance['refresh'],
            'user': AuthUserSerializer(user).data,
        }


class AuthRegisterSerializer(GarageRegistrationSerializer):
    def validate(self, attrs):
        attrs = super().validate(attrs)
        validate_user_password(attrs['password'])
        return attrs


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


class MecanicienCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'password', 'password2']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        validate_unique_user_fields(username=attrs.get('username'), email=attrs.get('email'))
        validate_user_password(attrs['password'])
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('password2')

        return create_mecanicien_for_garage(garage=self.context['garage'], password=password, **validated_data)


# -- Optionnel: Un Serializer plus complet pour le CRUD d'un user --
# class UserCRUDSerializer(serializers.ModelSerializer):
#     ...
