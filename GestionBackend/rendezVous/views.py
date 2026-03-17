# rendezVous/views.py

from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import RendezVous
from .serializers import RendezVousSerializer


class RendezVousViewSet(viewsets.ModelViewSet):
    queryset = RendezVous.objects.all()
    serializer_class = RendezVousSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filtre la liste des rendez-vous en fonction du rôle du user.
        - Si user.profile.role == 'client', on renvoie uniquement ses propres rendez-vous.
        - Si user.profile.role == 'mecanicien', on renvoie uniquement les rendez-vous qui lui sont attribués.
        - Si superuser (admin), on renvoie tous.
        """
        qs = super().get_queryset()
        user = self.request.user

        # Vérifier que le user possède un profil
        # (Supposons un modèle Profile avec un champ 'role' = [client, mecanicien, ...])
        if hasattr(user, 'profile'):
            role = user.profile.role
            if role == 'client':
                # Filtrer sur client = user
                qs = qs.filter(client=user)
            elif role == 'mecanicien':
                # Filtrer sur mecanicien = user
                qs = qs.filter(mecanicien=user)
            # Si c'est un superuser ou un autre rôle, on laisse tout
            # (ou on peut gérer d'autres conditions)
        return qs

    def perform_create(self, serializer):
        """
        Lors de la création d'un rendez-vous, on peut imposer le 'client' = user connecté
        (si on veut que seul un 'client' puisse créer un RDV pour lui-même).
        """
        if not hasattr(self.request.user, 'profile') or self.request.user.profile.role != 'client':
            raise PermissionDenied("Seul un client peut creer un rendez-vous.")
        serializer.save(client=self.request.user)
