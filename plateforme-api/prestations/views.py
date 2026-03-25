from django.db.models.deletion import ProtectedError
from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError

from prestations.models import CategoriePrestation, ServiceOffert
from prestations.serializers import CategoriePrestationSerializer, ServiceOffertSerializer


class GarageCategorieListCreateView(generics.ListCreateAPIView):
    serializer_class = CategoriePrestationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        garage = getattr(self.request.user.profile, 'garage', None)
        if garage is None:
            return CategoriePrestation.objects.none()
        return CategoriePrestation.objects.filter(garage=garage)

    def perform_create(self, serializer):
        garage = getattr(self.request.user.profile, 'garage', None)
        if garage is None:
            raise ValidationError('Aucun etablissement associe.')
        serializer.save(garage=garage)


class GarageCategorieDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategoriePrestationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        garage = getattr(self.request.user.profile, 'garage', None)
        if garage is None:
            return CategoriePrestation.objects.none()
        return CategoriePrestation.objects.filter(garage=garage)

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError(
                {'detail': 'Impossible de supprimer cette categorie : des services y sont rattaches.'}
            )


class GarageServiceListCreateView(generics.ListCreateAPIView):
    serializer_class = ServiceOffertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        garage = getattr(self.request.user.profile, 'garage', None)
        return ServiceOffert.objects.filter(garage=garage).select_related('categorie')

    def perform_create(self, serializer):
        garage = getattr(self.request.user.profile, 'garage', None)
        serializer.save(garage=garage)


class GarageServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ServiceOffertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        garage = getattr(self.request.user.profile, 'garage', None)
        return ServiceOffert.objects.filter(garage=garage).select_related('categorie')
