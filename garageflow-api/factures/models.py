# factures/models.py

from django.db import models
from django.utils import timezone

class Facture(models.Model):
    # On suppose que vous avez un app 'rendezVous' avec un modèle RendezVous
    # Si l’app s’appelle autrement, adaptez le nom dans la chaîne de l’import
    rendezvous = models.ForeignKey(
        'rendezVous.RendezVous',  
        on_delete=models.CASCADE,
        related_name='factures'
    )
    date_emission = models.DateTimeField(default=timezone.now)  # Timestamp auto
    montant = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payee = models.BooleanField(default=False)  # Pour marquer si la facture est payée
    mode_paiement = models.CharField(max_length=50, blank=True, null=True)  # "carte", "cash"...
    description = models.TextField(blank=True)  # champ libre

    def __str__(self):
        if self.rendezvous:
            return f"Facture #{self.id} - RendezVous #{self.rendezvous.id}"
        return f"Facture #{self.id}"

    class Meta:
        ordering = ['-date_emission']
