# vehicules/views.py
from rest_framework import viewsets, permissions
from .models import Vehicule
from .serializers import VehiculeSerializer

class VehiculeViewSet(viewsets.ModelViewSet):
    queryset = Vehicule.objects.all()
    serializer_class = VehiculeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Chaque utilisateur ne voit que ses propres véhicules
        user = self.request.user
        return Vehicule.objects.filter(owner=user)

    def perform_create(self, serializer):
        # Assigner automatiquement l'owner
        serializer.save(owner=self.request.user)
