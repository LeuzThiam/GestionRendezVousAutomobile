from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers


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
