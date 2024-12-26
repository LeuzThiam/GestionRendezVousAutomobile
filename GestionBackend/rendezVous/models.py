# rendezVous/models.py

from django.db import models
from django.conf import settings
from django.utils import timezone

STATUS_CHOICES = (
    ('pending', 'En attente'),
    ('confirmed', 'Confirmé'),
    ('modification_requested', 'Modification Demandée'),
    ('cancelled', 'Annulé'),
    ('done', 'Terminé'),
    ('rejected', 'Refusé'), 
    # Ajoutez ici toutes les valeurs nécessaires à votre logique
)

class RendezVous(models.Model):
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rendezvous_client'
    )
    mecanicien = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rendezvous_mecanicien'
    )
    date = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    description = models.TextField(blank=True)

    estimatedTime = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Durée estimée (en heures)."
    )
    quote = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Devis (en €)."
    )

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"RendezVous #{self.id} - {self.client.username} -> {self.mecanicien.username}"
