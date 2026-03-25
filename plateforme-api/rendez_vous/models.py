# rendez_vous/models.py

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
    garage = models.ForeignKey(
        'garages.Organization',
        on_delete=models.SET_NULL,
        related_name='rendezvous',
        null=True,
        blank=True
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rendezvous_client'
    )
    mecanicien = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rendezvous_mecanicien',
        null=True,
        blank=True,
    )
    service = models.ForeignKey(
        'prestations.ServiceOffert',
        on_delete=models.SET_NULL,
        related_name='rendezvous',
        null=True,
        blank=True,
    )
    date = models.DateTimeField(default=timezone.now)
    requested_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    description = models.TextField(blank=True)
    reason = models.TextField(blank=True)

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
    confirmed_at = models.DateTimeField(null=True, blank=True)
    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='rendezvous_confirmed_actions',
        null=True,
        blank=True,
    )
    rejected_at = models.DateTimeField(null=True, blank=True)
    rejected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='rendezvous_rejected_actions',
        null=True,
        blank=True,
    )
    reprogrammed_at = models.DateTimeField(null=True, blank=True)
    reprogrammed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='rendezvous_reprogrammed_actions',
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ['-date']

    def __str__(self):
        if self.mecanicien_id:
            return f"RendezVous #{self.id} - {self.client.username} -> {self.mecanicien.username}"
        return f"RendezVous #{self.id} - {self.client.username} -> {self.garage or 'Etablissement non defini'}"

from reprogrammations.models import ReprogrammationProposition

__all__ = ['RendezVous', 'ReprogrammationProposition', 'STATUS_CHOICES']
