from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import AuthLoginView, AuthLogoutView, AuthMeView, AuthRegisterView


urlpatterns = [
    path('register/', AuthRegisterView.as_view(), name='auth-register'),
    path('login/', AuthLoginView.as_view(), name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('logout/', AuthLogoutView.as_view(), name='auth-logout'),
    path('me/', AuthMeView.as_view(), name='auth-me'),
]
