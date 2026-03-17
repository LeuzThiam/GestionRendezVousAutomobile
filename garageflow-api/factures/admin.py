# factures/admin.py
from django.contrib import admin
from .models import Facture

@admin.register(Facture)
class FactureAdmin(admin.ModelAdmin):
    list_display = ('id', 'rendezvous', 'date_emission', 'montant', 'payee')
