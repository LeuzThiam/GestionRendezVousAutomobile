from django.conf import settings
from django.db import models


class ReprogrammationProposition(models.Model):
    PROPOSAL_TYPE_CHOICES = (
        ('client_request', 'Proposition client'),
        ('garage_counter', 'Contre-proposition garage'),
    )
    RESPONSE_STATUS_CHOICES = (
        ('pending', 'En attente'),
        ('accepted', 'Acceptee'),
        ('rejected', 'Refusee'),
        ('superseded', 'Remplacee'),
    )

    rendez_vous = models.ForeignKey(
        'rendezVous.RendezVous',
        on_delete=models.CASCADE,
        related_name='reprogrammation_propositions',
    )
    proposed_date = models.DateTimeField()
    proposal_type = models.CharField(max_length=30, choices=PROPOSAL_TYPE_CHOICES)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='reprogrammation_propositions_creees',
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    internal_note = models.TextField(blank=True)
    response_status = models.CharField(
        max_length=20,
        choices=RESPONSE_STATUS_CHOICES,
        default='pending',
    )
    responded_at = models.DateTimeField(null=True, blank=True)
    responded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='reprogrammation_propositions_traitees',
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ['-created_at']
        db_table = 'rendezVous_reprogrammationproposition'

    def __str__(self):
        return (
            f"Reprogrammation #{self.id} - RDV {self.rendez_vous_id} - "
            f"{self.get_proposal_type_display()} ({self.get_response_status_display()})"
        )

