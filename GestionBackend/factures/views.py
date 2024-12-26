# factures/views.py

from rest_framework import viewsets, permissions
from .models import Facture
from .serializers import FactureSerializer

class FactureViewSet(viewsets.ModelViewSet):
    queryset = Facture.objects.all()
    serializer_class = FactureSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filtrer selon l'utilisateur et/ou son rôle (client, mecanicien),
        si nécessaire. Par exemple, un client voit ses factures (rendezvous.client),
        un mécano voit celles dont il s’occupe (rendezvous.mecanicien).
        """
        user = self.request.user
        qs = super().get_queryset()

        # Filtrage selon profil
        if not user.is_superuser:
            if hasattr(user, 'profile') and user.profile.role == 'client':
                # Factures dont le RendezVous est lié à ce client
                qs = qs.filter(rendezvous__client=user)
            elif hasattr(user, 'profile') and user.profile.role == 'mecanicien':
                # Factures dont le RendezVous est lié à ce mecano
                qs = qs.filter(rendezvous__mecanicien=user)
        return qs

    def perform_create(self, serializer):
        """
        Exécuté lors d'un POST (création).
        Si vous voulez imposer une logique (ex: calcul auto),
        ou vérifier que user = rendezvous.client, vous pouvez le faire ici.
        """
        # Par exemple, on pourrait forcer payee=False au départ :
        # serializer.save(payee=False)
        serializer.save()
