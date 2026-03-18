# rendez_vous/views.py

from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import RendezVous
from .serializers import RendezVousSerializer
from .permissions import IsClientForCreate
from .services import get_rendezvous_creation_payload, get_rendezvous_queryset_for_user


class RendezVousViewSet(viewsets.ModelViewSet):
    queryset = RendezVous.objects.all()
    serializer_class = RendezVousSerializer
    permission_classes = [permissions.IsAuthenticated, IsClientForCreate]

    def get_queryset(self):
        return get_rendezvous_queryset_for_user(self.request.user)

    def perform_create(self, serializer):
        payload = get_rendezvous_creation_payload(self.request.user)
        if payload['garage'] is None:
            raise PermissionDenied("Le client doit appartenir a un garage pour creer un rendez-vous.")
        serializer.save(**payload)
