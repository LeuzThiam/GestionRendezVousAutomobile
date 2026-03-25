from django.contrib.auth.models import User
from rest_framework import serializers

from comptes.services import (
    assign_profile,
    create_basic_user,
    normalize_profile_role,
    update_user_and_profile,
)
from comptes.models import Profile
from comptes.validators import validate_unique_user_fields, validate_user_password
from organizations.models import Organization


class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)
    role = serializers.CharField(write_only=True)
    organization_id = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(),
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
            'password', 'password2', 'role', 'organization_id', 'date_naissance'
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
        password = validated_data.pop('password')
        validated_data.pop('password2')
        role = validated_data.pop('role')
        profile_data = validated_data.pop('profile', {})
        normalized_role = normalize_profile_role(role)
        garage = profile_data.get('garage') if normalized_role != 'client' else None
        date_naissance = validated_data.pop('date_naissance', None)

        user = create_basic_user(password=password, **validated_data)
        assign_profile(
            user,
            role=normalized_role,
            garage=garage,
            date_naissance=date_naissance,
        )
        return user


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    organization_id = serializers.IntegerField(source='garage.id', read_only=True)
    organization_name = serializers.CharField(source='garage.name', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'organization_id',
            'organization_name',
            'date_naissance',
        ]


class UserUpdateSerializer(serializers.ModelSerializer):
    role = serializers.CharField(write_only=True, required=False)
    organization_id = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(),
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
        fields = ['first_name', 'last_name', 'email', 'role', 'organization_id', 'date_naissance']

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
