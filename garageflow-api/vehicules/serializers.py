# vehicules/serializers.py
from rest_framework import serializers
from .models import Vehicule

class VehiculeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicule
        fields = [
            'id',
            'owner',
            'garage',
            'marque',
            'modele',
            'annee',
            'vin',
            'body_class',
            'vehicle_type'
        ]
        read_only_fields = ['id', 'owner', 'garage']
