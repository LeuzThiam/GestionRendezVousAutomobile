# rendezVous/serializers.py

from rest_framework import serializers
from .models import RendezVous

class RendezVousSerializer(serializers.ModelSerializer):
    class Meta:
        model = RendezVous
        fields = [
            'id',
            'client',
            'mecanicien',
            'date',
            'status',
            'description',
            'estimatedTime',
            'quote',
        ]
        read_only_fields = [
            'id', 
            'client'  # si vous forcez le client = user dans la vue
        ]
        # IMPORTANT: on ne met PAS 'estimatedTime' ni 'quote' dans read_only_fields
