from rest_framework import generics, permissions

from planification.serializers import DisponibiliteGarageSerializer, FermetureExceptionnelleGarageSerializer
from planification.services import get_current_user_garage, get_garage_disponibilites_queryset, get_garage_fermetures_queryset


class GarageDisponibiliteListCreateView(generics.ListCreateAPIView):
    serializer_class = DisponibiliteGarageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return get_garage_disponibilites_queryset(get_current_user_garage(self.request.user))

    def perform_create(self, serializer):
        serializer.save(garage=get_current_user_garage(self.request.user))


class GarageDisponibiliteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DisponibiliteGarageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return get_garage_disponibilites_queryset(get_current_user_garage(self.request.user))


class GarageFermetureExceptionnelleListCreateView(generics.ListCreateAPIView):
    serializer_class = FermetureExceptionnelleGarageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return get_garage_fermetures_queryset(get_current_user_garage(self.request.user))

    def perform_create(self, serializer):
        serializer.save(garage=get_current_user_garage(self.request.user))


class GarageFermetureExceptionnelleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FermetureExceptionnelleGarageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return get_garage_fermetures_queryset(get_current_user_garage(self.request.user))

