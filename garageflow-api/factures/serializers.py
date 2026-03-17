# factures/serializers.py

from rest_framework import serializers
from .models import Facture

class FactureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Facture
        fields = [
            'id',
            'rendezvous',
            'date_emission',
            'montant',
            'payee',
            'mode_paiement',
            'description',
        ]
        read_only_fields = ['id', 'date_emission']
