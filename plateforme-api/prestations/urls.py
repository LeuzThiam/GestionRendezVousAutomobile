from django.urls import path

from prestations.views import GarageServiceDetailView, GarageServiceListCreateView


urlpatterns = [
    path('garages/me/services/', GarageServiceListCreateView.as_view(), name='prestations-garage-service-list-create'),
    path('garages/me/services/<int:pk>/', GarageServiceDetailView.as_view(), name='prestations-garage-service-detail'),
]

