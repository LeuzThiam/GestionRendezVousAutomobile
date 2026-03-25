from django.urls import path

from .views import (
    CurrentOrganizationView,
    GarageCategorieDetailView,
    GarageCategorieListCreateView,
    GarageDisponibiliteDetailView,
    GarageDisponibiliteListCreateView,
    GarageFermetureExceptionnelleDetailView,
    GarageFermetureExceptionnelleListCreateView,
    OrganizationRegistrationView,
    PublicOrganizationDetailView,
    PublicOrganizationListView,
    GarageServiceListCreateView,
    GarageServiceDetailView,
)


urlpatterns = [
    path('register/', OrganizationRegistrationView.as_view(), name='organization-register'),
    path('me/', CurrentOrganizationView.as_view(), name='organization-current'),
    path('me/disponibilites/', GarageDisponibiliteListCreateView.as_view(), name='garage-disponibilite-list-create'),
    path('me/disponibilites/<int:pk>/', GarageDisponibiliteDetailView.as_view(), name='garage-disponibilite-detail'),
    path('me/fermetures/', GarageFermetureExceptionnelleListCreateView.as_view(), name='garage-fermeture-list-create'),
    path('me/fermetures/<int:pk>/', GarageFermetureExceptionnelleDetailView.as_view(), name='garage-fermeture-detail'),
    path('me/categories/', GarageCategorieListCreateView.as_view(), name='garage-categorie-list-create'),
    path('me/categories/<int:pk>/', GarageCategorieDetailView.as_view(), name='garage-categorie-detail'),
    path('me/services/', GarageServiceListCreateView.as_view(), name='garage-service-list-create'),
    path('me/services/<int:pk>/', GarageServiceDetailView.as_view(), name='garage-service-detail'),
    path('public/', PublicOrganizationListView.as_view(), name='organization-public-list'),
    path('public/<slug:slug>/', PublicOrganizationDetailView.as_view(), name='organization-public-detail'),
]
