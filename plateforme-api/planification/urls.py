from django.urls import path

from planification.views import (
    GarageDisponibiliteDetailView,
    GarageDisponibiliteListCreateView,
    GarageFermetureExceptionnelleDetailView,
    GarageFermetureExceptionnelleListCreateView,
)


urlpatterns = [
    path('garages/me/disponibilites/', GarageDisponibiliteListCreateView.as_view(), name='planification-garage-disponibilite-list-create'),
    path('garages/me/disponibilites/<int:pk>/', GarageDisponibiliteDetailView.as_view(), name='planification-garage-disponibilite-detail'),
    path('garages/me/fermetures/', GarageFermetureExceptionnelleListCreateView.as_view(), name='planification-garage-fermeture-list-create'),
    path('garages/me/fermetures/<int:pk>/', GarageFermetureExceptionnelleDetailView.as_view(), name='planification-garage-fermeture-detail'),
]
