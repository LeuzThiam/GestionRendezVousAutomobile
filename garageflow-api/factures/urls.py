# factures/urls.py

from rest_framework.routers import DefaultRouter
from .views import FactureViewSet

router = DefaultRouter()
router.register('', FactureViewSet, basename='factures')

urlpatterns = router.urls
