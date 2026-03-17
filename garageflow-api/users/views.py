# users/views.py

from rest_framework import generics, permissions
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import PermissionDenied

from .serializers import (
    UserRegistrationSerializer,
    ProfileSerializer,
    UserUpdateSerializer,
    MyTokenObtainPairSerializer,
    UserListSerializer,
    MecanicienCreateSerializer,
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
        garage = getattr(self.request.user.profile, 'garage', None)
        queryset = User.objects.filter(profile__role='mecanicien')
        if garage is not None:
            queryset = queryset.filter(profile__garage=garage)
        return queryset


class MecanicienManagementView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MecanicienCreateSerializer
        return UserListSerializer

    def get_queryset(self):
        garage = getattr(self.request.user.profile, 'garage', None)
        queryset = User.objects.filter(profile__role='mecanicien')
        if garage is not None:
            queryset = queryset.filter(profile__garage=garage)
        return queryset

    def create(self, request, *args, **kwargs):
        profile = getattr(request.user, 'profile', None)
        if getattr(profile, 'role', None) != 'owner' or profile.garage is None:
            raise PermissionDenied("Seul le proprietaire du garage peut creer un mecanicien.")

        serializer = self.get_serializer(data=request.data, context={'garage': profile.garage})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserListSerializer(user).data, status=201)


class MecanicienDetailView(generics.DestroyAPIView):
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = getattr(self.request.user, 'profile', None)
        garage = getattr(profile, 'garage', None)
        return User.objects.filter(profile__role='mecanicien', profile__garage=garage)

    def destroy(self, request, *args, **kwargs):
        profile = getattr(request.user, 'profile', None)
        if getattr(profile, 'role', None) != 'owner' or profile.garage is None:
            raise PermissionDenied("Seul le proprietaire du garage peut supprimer un mecanicien.")
        return super().destroy(request, *args, **kwargs)


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
