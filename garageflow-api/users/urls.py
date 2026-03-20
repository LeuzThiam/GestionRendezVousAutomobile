# users/urls.py

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserRegistrationView,
    UserProfileView,
    UserProfileUpdateView,
    MyTokenObtainPairView,
    MecanicienListView,
    MecanicienManagementView,
    MecanicienDetailView,
    MecanicienDisponibiliteListCreateView,
    MecanicienDisponibiliteDetailView,
    UserDetailView  # <-- NOUVEAU
)

urlpatterns = [
    # Enregistrement
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    
    # Profil
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('profile/update/', UserProfileUpdateView.as_view(), name='user-profile-update'),

    # JWT
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Liste des mécaniciens
    path('mecaniciens/', MecanicienListView.as_view(), name='mecaniciens-list'),
    path('owner/mecaniciens/', MecanicienManagementView.as_view(), name='owner-mecaniciens'),
    path('owner/mecaniciens/<int:pk>/', MecanicienDetailView.as_view(), name='owner-mecanicien-detail'),
    path('owner/mecaniciens/disponibilites/', MecanicienDisponibiliteListCreateView.as_view(), name='owner-mecanicien-disponibilites'),
    path('owner/mecaniciens/disponibilites/<int:pk>/', MecanicienDisponibiliteDetailView.as_view(), name='owner-mecanicien-disponibilite-detail'),

    # NOUVEAU : CRUD (RUD) sur un user par son ID
    path('<int:pk>/', UserDetailView.as_view(), name='user-detail'),
]
