from django.db.models import Count, Q
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DisponibiliteGarage, FermetureExceptionnelleGarage, Garage, ServiceOffert
from .serializers import (
    GarageRegistrationSerializer,
    GarageSerializer,
    PublicGarageListSerializer,
    PublicGarageSerializer,
    DisponibiliteGarageSerializer,
    FermetureExceptionnelleGarageSerializer,
    ServiceOffertSerializer,
)


class GarageRegistrationView(generics.CreateAPIView):
    queryset = Garage.objects.all()
    serializer_class = GarageRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class CurrentGarageView(generics.RetrieveUpdateAPIView):
    serializer_class = GarageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        garage = getattr(self.request.user.profile, 'garage', None)
        if garage is None:
            from rest_framework.exceptions import NotFound
            raise NotFound("Aucun garage associe a cet utilisateur.")
        return garage


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
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(address__icontains=search)
                | Q(slug__icontains=search)
                | Q(services__nom__icontains=search, services__actif=True)
            )
        return queryset.annotate(
            mecaniciens_count=Count('profiles', filter=Q(profiles__role='mecanicien'))
        ).distinct()


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


class GarageFermetureExceptionnelleListCreateView(generics.ListCreateAPIView):
    serializer_class = FermetureExceptionnelleGarageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        garage = getattr(self.request.user.profile, 'garage', None)
        return FermetureExceptionnelleGarage.objects.filter(garage=garage)

    def perform_create(self, serializer):
        garage = getattr(self.request.user.profile, 'garage', None)
        serializer.save(garage=garage)


class GarageFermetureExceptionnelleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FermetureExceptionnelleGarageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        garage = getattr(self.request.user.profile, 'garage', None)
        return FermetureExceptionnelleGarage.objects.filter(garage=garage)
