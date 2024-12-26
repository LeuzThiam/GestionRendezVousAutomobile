# users/urls.py

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserRegistrationView,
    UserProfileView,
    UserProfileUpdateView,
    MyTokenObtainPairView,
    MecanicienListView,
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

    # NOUVEAU : CRUD (RUD) sur un user par son ID
    path('<int:pk>/', UserDetailView.as_view(), name='user-detail'),
]
