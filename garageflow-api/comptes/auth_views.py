from django.contrib.auth.models import User
from garages.models import Garage
from rest_framework import generics, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from comptes.auth_serializers import (
    AuthClientRegisterSerializer,
    AuthLoginSerializer,
    AuthOwnerRegisterSerializer,
    MyTokenObtainPairSerializer,
)
from comptes.serializers import ProfileSerializer


class AuthRegisterView(generics.CreateAPIView):
    queryset = Garage.objects.all()
    serializer_class = AuthOwnerRegisterSerializer
    permission_classes = [permissions.AllowAny]


class AuthOwnerRegisterView(generics.CreateAPIView):
    queryset = Garage.objects.all()
    serializer_class = AuthOwnerRegisterSerializer
    permission_classes = [permissions.AllowAny]


class AuthClientRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = AuthClientRegisterSerializer
    permission_classes = [permissions.AllowAny]


class AuthLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AuthLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)


class AuthLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(status=204)


class AuthMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user.profile)
        return Response(serializer.data)


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

