from rest_framework.routers import DefaultRouter
from .views import RendezVousViewSet

router = DefaultRouter()
router.register('', RendezVousViewSet, basename='rendezvous')

urlpatterns = router.urls
