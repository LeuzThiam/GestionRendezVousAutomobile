from django.db.models import Count, Q
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DisponibiliteGarage, Garage, ServiceOffert
from .serializers import (
    GarageRegistrationSerializer,
    GarageSerializer,
    PublicGarageListSerializer,
    PublicGarageSerializer,
    DisponibiliteGarageSerializer,
    ServiceOffertSerializer,
)


class GarageRegistrationView(generics.CreateAPIView):
    queryset = Garage.objects.all()
    serializer_class = GarageRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class CurrentGarageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        garage = getattr(request.user.profile, 'garage', None)
        if garage is None:
            return Response({'detail': "Aucun garage associe a cet utilisateur."}, status=404)
        serializer = GarageSerializer(garage)
        return Response(serializer.data)


class PublicGarageDetailView(generics.RetrieveAPIView):
    queryset = Garage.objects.filter(is_active=True)
    serializer_class = PublicGarageSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class PublicGarageListView(generics.ListAPIView):
    serializer_class = PublicGarageListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Garage.objects.filter(is_active=True)
        search = self.request.query_params.get('q', '').strip()
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset.annotate(
            mecaniciens_count=Count('profiles', filter=Q(profiles__role='mecanicien'))
        )


class GarageServiceListCreateView(generics.ListCreateAPIView):
    serializer_class = ServiceOffertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        garage = getattr(self.request.user.profile, 'garage', None)
        return ServiceOffert.objects.filter(garage=garage)

    def perform_create(self, serializer):
        garage = getattr(self.request.user.profile, 'garage', None)
        serializer.save(garage=garage)


class GarageServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ServiceOffertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        garage = getattr(self.request.user.profile, 'garage', None)
        return ServiceOffert.objects.filter(garage=garage)


class GarageDisponibiliteListCreateView(generics.ListCreateAPIView):
    serializer_class = DisponibiliteGarageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        garage = getattr(self.request.user.profile, 'garage', None)
        return DisponibiliteGarage.objects.filter(garage=garage)

    def perform_create(self, serializer):
        garage = getattr(self.request.user.profile, 'garage', None)
        serializer.save(garage=garage)


class GarageDisponibiliteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DisponibiliteGarageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        garage = getattr(self.request.user.profile, 'garage', None)
        return DisponibiliteGarage.objects.filter(garage=garage)
