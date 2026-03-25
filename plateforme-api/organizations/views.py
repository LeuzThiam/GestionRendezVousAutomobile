from django.db.models import Count, Prefetch, Q
from rest_framework import generics, permissions

from planification.views import (
    GarageDisponibiliteDetailView,
    GarageDisponibiliteListCreateView,
    GarageFermetureExceptionnelleDetailView,
    GarageFermetureExceptionnelleListCreateView,
)
from prestations.models import ServiceOffert
from prestations.views import (
    GarageCategorieDetailView,
    GarageCategorieListCreateView,
    GarageServiceDetailView,
    GarageServiceListCreateView,
)

from .models import Organization
from .serializers import (
    OrganizationRegistrationSerializer,
    OrganizationSerializer,
    PublicOrganizationListSerializer,
    PublicOrganizationSerializer,
)


class OrganizationRegistrationView(generics.CreateAPIView):
    queryset = Organization.objects.all()
    serializer_class = OrganizationRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class CurrentOrganizationView(generics.RetrieveUpdateAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        org = getattr(self.request.user.profile, 'garage', None)
        if org is None:
            from rest_framework.exceptions import NotFound
            raise NotFound("Aucune organisation associee a cet utilisateur.")
        return org


class PublicOrganizationDetailView(generics.RetrieveAPIView):
    queryset = Organization.objects.filter(is_active=True).prefetch_related(
        Prefetch(
            'services',
            queryset=ServiceOffert.objects.filter(actif=True).select_related('categorie'),
        ),
    )
    serializer_class = PublicOrganizationSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class PublicOrganizationListView(generics.ListAPIView):
    serializer_class = PublicOrganizationListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Organization.objects.filter(is_active=True)
        search = self.request.query_params.get('q', '').strip()
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(address__icontains=search)
                | Q(slug__icontains=search)
                | Q(services__nom__icontains=search, services__actif=True)
            )
        return queryset.annotate(
            employes_count=Count('profiles', filter=Q(profiles__role='employe'))
        ).distinct()
