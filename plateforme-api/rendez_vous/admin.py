# rendez_vous/admin.py

from django.contrib import admin
from .models import RendezVous

@admin.register(RendezVous)
class RendezVousAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'client',
        'mecanicien',
        'date',
        'status',        # <-- remplacer "statut" par "status" si c'est bien le champ existant
        'description',
    )
