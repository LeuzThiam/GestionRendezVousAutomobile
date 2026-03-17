from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Garage
from .serializers import GarageRegistrationSerializer, GarageSerializer


class GarageRegistrationView(generics.CreateAPIView):
    queryset = Garage.objects.all()
    serializer_class = GarageRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class CurrentGarageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        garage = getattr(request.user.profile, 'garage', None)
        if garage is None:
            return Response({'detail': "Aucun garage associe a cet utilisateur."}, status=404)
        serializer = GarageSerializer(garage)
        return Response(serializer.data)
