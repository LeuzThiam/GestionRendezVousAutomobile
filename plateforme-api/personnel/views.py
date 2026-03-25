from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from comptes.services import get_user_garage
from personnel.permissions import IsGarageOwner
from personnel.models import MecanicienDisponibilite
from personnel.serializers import (
    MecanicienCreateSerializer,
    MecanicienDisponibiliteSerializer,
    MecanicienUpdateSerializer,
    UserListSerializer,
)
from personnel.services import list_mecaniciens_for_garage


class MecanicienListView(generics.ListAPIView):
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return list_mecaniciens_for_garage(get_user_garage(self.request.user))


class MecanicienManagementView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MecanicienCreateSerializer
        return UserListSerializer

    def get_queryset(self):
        return list_mecaniciens_for_garage(get_user_garage(self.request.user))

    def create(self, request, *args, **kwargs):
        self.check_permissions(request)
        garage = get_user_garage(request.user)
        serializer = self.get_serializer(data=request.data, context={'garage': garage})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserListSerializer(user).data, status=201)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsGarageOwner()]
        return [IsAuthenticated()]


class MecanicienDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsGarageOwner]

    def get_serializer_class(self):
        if self.request.method in {'PUT', 'PATCH'}:
            return MecanicienUpdateSerializer
        return UserListSerializer

    def get_queryset(self):
        return list_mecaniciens_for_garage(get_user_garage(self.request.user))

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        has_upcoming_rendezvous = instance.rendezvous_mecanicien.filter(
            status='confirmed',
            date__gte=timezone.now(),
        ).exists()
        if has_upcoming_rendezvous:
            return Response(
                {'detail': "Ce mecanicien a encore des rendez-vous a venir. Desactivez-le au lieu de le supprimer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


class MecanicienDisponibiliteListCreateView(generics.ListCreateAPIView):
    serializer_class = MecanicienDisponibiliteSerializer
    permission_classes = [IsAuthenticated, IsGarageOwner]

    def get_queryset(self):
        garage = get_user_garage(self.request.user)
        queryset = MecanicienDisponibilite.objects.filter(mecanicien__profile__garage=garage)
        mecanicien_id = self.request.query_params.get('mecanicien')
        if mecanicien_id:
            queryset = queryset.filter(mecanicien_id=mecanicien_id)
        return queryset


class MecanicienDisponibiliteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MecanicienDisponibiliteSerializer
    permission_classes = [IsAuthenticated, IsGarageOwner]

    def get_queryset(self):
        garage = get_user_garage(self.request.user)
        return MecanicienDisponibilite.objects.filter(mecanicien__profile__garage=garage)
