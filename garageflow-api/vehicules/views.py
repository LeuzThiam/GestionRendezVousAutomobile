# vehicules/views.py
from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Vehicule
from .serializers import VehiculeSerializer

class VehiculeViewSet(viewsets.ModelViewSet):
    queryset = Vehicule.objects.all()
    serializer_class = VehiculeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = getattr(getattr(user, 'profile', None), 'role', None)
        garage = getattr(getattr(user, 'profile', None), 'garage', None)

        if role == 'owner' and garage is not None:
            return Vehicule.objects.filter(garage=garage)
        return Vehicule.objects.filter(owner=user)

    def perform_create(self, serializer):
        garage = getattr(getattr(self.request.user, 'profile', None), 'garage', None)
        if garage is None:
            raise PermissionDenied("Un utilisateur doit appartenir a un garage pour enregistrer un vehicule.")
        serializer.save(owner=self.request.user, garage=garage)
