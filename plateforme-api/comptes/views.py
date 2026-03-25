from django.contrib.auth.models import User
from rest_framework import generics, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from comptes.auth_views import MyTokenObtainPairView
from comptes.serializers import (
    ProfileSerializer,
    UserRegistrationSerializer,
    UserUpdateSerializer,
)
from personnel.serializers import UserListSerializer


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user.profile)
        return Response(serializer.data)


class UserProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        return self.update_user(request, partial=False)

    def patch(self, request):
        return self.update_user(request, partial=True)

    def update_user(self, request, partial=False):
        user = request.user
        serializer = UserUpdateSerializer(user, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        profile_serializer = ProfileSerializer(user.profile)
        return Response(profile_serializer.data)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAdminUser]


class LegacyTokenRefreshView(TokenRefreshView):
    """Compatibilite avec /api/users/token/refresh/ tant que le frontend evolue."""
