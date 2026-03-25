from django.urls import path

from personnel.views import (
    MecanicienDetailView,
    MecanicienDisponibiliteDetailView,
    MecanicienDisponibiliteListCreateView,
    MecanicienListView,
    MecanicienManagementView,
)


urlpatterns = [
    path('mecaniciens/', MecanicienListView.as_view(), name='personnel-mecaniciens-list'),
    path('owner/mecaniciens/', MecanicienManagementView.as_view(), name='personnel-owner-mecaniciens'),
    path('owner/mecaniciens/<int:pk>/', MecanicienDetailView.as_view(), name='personnel-owner-mecanicien-detail'),
    path('owner/mecaniciens/disponibilites/', MecanicienDisponibiliteListCreateView.as_view(), name='personnel-owner-mecanicien-disponibilites'),
    path('owner/mecaniciens/disponibilites/<int:pk>/', MecanicienDisponibiliteDetailView.as_view(), name='personnel-owner-mecanicien-disponibilite-detail'),
]
