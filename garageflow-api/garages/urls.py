from django.urls import path

from .views import CurrentGarageView, GarageRegistrationView


urlpatterns = [
    path('register/', GarageRegistrationView.as_view(), name='garage-register'),
    path('me/', CurrentGarageView.as_view(), name='garage-current'),
]
