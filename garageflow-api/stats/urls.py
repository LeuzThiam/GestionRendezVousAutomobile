# stats/urls.py

from django.urls import path
from .views import stats_view

urlpatterns = [
    # Page HTML
    path('page/', stats_view, name='stats-page'),

    # API JSON
    # path('api/', StatsAPIView.as_view(), name='stats-api'),
]
