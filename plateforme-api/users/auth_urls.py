from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from comptes.auth_views import (
    AuthClientRegisterView,
    AuthLoginView,
    AuthLogoutView,
    AuthMeView,
    AuthOwnerRegisterView,
    AuthRegisterView,
)


urlpatterns = [
    path('register/', AuthRegisterView.as_view(), name='auth-register'),
    path('register/owner/', AuthOwnerRegisterView.as_view(), name='auth-register-owner'),
    path('register/client/', AuthClientRegisterView.as_view(), name='auth-register-client'),
    path('login/', AuthLoginView.as_view(), name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('logout/', AuthLogoutView.as_view(), name='auth-logout'),
    path('me/', AuthMeView.as_view(), name='auth-me'),
]
