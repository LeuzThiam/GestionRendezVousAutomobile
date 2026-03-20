from django.urls import path

from .views import (
    CurrentGarageView,
    GarageDisponibiliteDetailView,
    GarageDisponibiliteListCreateView,
    GarageRegistrationView,
    PublicGarageDetailView,
    PublicGarageListView,
    GarageServiceListCreateView,
    GarageServiceDetailView,
)


urlpatterns = [
    path('register/', GarageRegistrationView.as_view(), name='garage-register'),
    path('me/', CurrentGarageView.as_view(), name='garage-current'),
    path('me/disponibilites/', GarageDisponibiliteListCreateView.as_view(), name='garage-disponibilite-list-create'),
    path('me/disponibilites/<int:pk>/', GarageDisponibiliteDetailView.as_view(), name='garage-disponibilite-detail'),
    path('me/services/', GarageServiceListCreateView.as_view(), name='garage-service-list-create'),
    path('me/services/<int:pk>/', GarageServiceDetailView.as_view(), name='garage-service-detail'),
    path('public/', PublicGarageListView.as_view(), name='garage-public-list'),
    path('public/<slug:slug>/', PublicGarageDetailView.as_view(), name='garage-public-detail'),
]
