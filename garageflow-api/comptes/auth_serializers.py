from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from comptes.serializers import ProfileSerializer
from comptes.services import assign_profile, create_basic_user
from comptes.validators import validate_unique_user_fields, validate_user_password
from garages.serializers import GarageRegistrationSerializer


class AuthUserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)
    garage_id = serializers.IntegerField(source='profile.garage_id', read_only=True)
    garage_name = serializers.CharField(source='profile.garage.name', read_only=True)

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
            'garage_name',
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

        if not user.check_password(password) or not user.is_active:
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


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
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


class AuthOwnerRegisterSerializer(GarageRegistrationSerializer):
    def validate(self, attrs):
        attrs = super().validate(attrs)
        validate_user_password(attrs['password'])
        return attrs


class AuthClientRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")

        validate_unique_user_fields(username=attrs.get('username'), email=attrs.get('email'))
        validate_user_password(attrs['password'])
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('password2')

        user = create_basic_user(password=password, **validated_data)
        assign_profile(user, role='client')
        return user

    def to_representation(self, instance):
        return AuthUserSerializer(instance).data

