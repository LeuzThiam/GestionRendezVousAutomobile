from django.urls import path

from comptes.auth_views import MyTokenObtainPairView
from comptes.views import (
    LegacyTokenRefreshView,
    UserDetailView,
    UserProfileUpdateView,
    UserProfileView,
    UserRegistrationView,
)


urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('profile/update/', UserProfileUpdateView.as_view(), name='user-profile-update'),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', LegacyTokenRefreshView.as_view(), name='token_refresh'),
    path('<int:pk>/', UserDetailView.as_view(), name='user-detail'),
]
