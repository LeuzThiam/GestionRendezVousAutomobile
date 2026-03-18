from django.urls import path

from .views import CurrentGarageView, GarageRegistrationView, PublicGarageDetailView


urlpatterns = [
    path('register/', GarageRegistrationView.as_view(), name='garage-register'),
    path('me/', CurrentGarageView.as_view(), name='garage-current'),
    path('public/<slug:slug>/', PublicGarageDetailView.as_view(), name='garage-public-detail'),
]
