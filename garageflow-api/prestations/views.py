from rest_framework import generics, permissions

from prestations.models import ServiceOffert
from prestations.serializers import ServiceOffertSerializer


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

