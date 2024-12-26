# vehicules/admin.py

from django.contrib import admin
from .models import Vehicule

@admin.register(Vehicule)
class VehiculeAdmin(admin.ModelAdmin):
    list_display = ('id', 'owner', 'marque', 'modele', 'annee', 'vin')
    search_fields = ('marque', 'modele', 'vin')
