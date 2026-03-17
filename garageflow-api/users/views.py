# users/views.py

from rest_framework import generics, permissions
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    UserRegistrationSerializer,
    ProfileSerializer,
    UserUpdateSerializer,
    MyTokenObtainPairSerializer,
    UserListSerializer
)
from .models import Profile


class UserRegistrationView(generics.CreateAPIView):
    """
    POST /api/users/register/
    Crée un nouvel utilisateur + profil associé.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer


class UserProfileView(APIView):
    """
    GET /api/users/profile/
    Retourne les infos du profil pour l'utilisateur connecté (protégé).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)


class UserProfileUpdateView(APIView):
    """
    PUT / PATCH /api/users/profile/update/
    Met à jour l'utilisateur + le profil du user connecté.
    """
    permission_classes = [IsAuthenticated]

    def put(self, request):
        return self.update_user(request, partial=False)

    def patch(self, request):
        return self.update_user(request, partial=True)

    def update_user(self, request, partial=False):
        user = request.user
        serializer = UserUpdateSerializer(user, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            profile_serializer = ProfileSerializer(user.profile)
            return Response(profile_serializer.data)
        return Response(serializer.errors, status=400)


class MyTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/users/token/
    Retourne un token JWT (access/refresh) + 'role'.
    """
    serializer_class = MyTokenObtainPairSerializer


class MecanicienListView(generics.ListAPIView):
    """
    GET /api/users/mecaniciens/
    Retourne tous les utilisateurs ayant un profile.role = 'mecanicien'.
    """
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated]  # ou [AllowAny], selon besoin

    def get_queryset(self):
        return User.objects.filter(profile__role='mecanicien')


# == NOUVEAU : Lire/Mettre à jour/Supprimer un utilisateur par son ID ==
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/users/<id>/
    PUT / PATCH /api/users/<id>/
    DELETE /api/users/<id>/
    """

    queryset = User.objects.all()
    serializer_class = UserListSerializer  # ou un autre serializer plus complet
    permission_classes = [permissions.IsAdminUser]  
    # => Ici, seul l'admin peut accéder (lecture/suppression).
    # Adaptez selon votre logique.
