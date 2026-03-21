from django.db import models


class ServiceOffert(models.Model):
    CATEGORY_CHOICES = (
        ('entretien', 'Entretien'),
        ('diagnostic', 'Diagnostic'),
        ('reparation', 'Reparation'),
        ('urgence', 'Urgence'),
    )

    garage = models.ForeignKey(
        'garages.Garage',
        on_delete=models.CASCADE,
        related_name='services',
    )
    nom = models.CharField(max_length=150)
    categorie = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='entretien')
    description = models.TextField(blank=True)
    duree_estimee = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    prix_indicatif = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    ordre_affichage = models.PositiveIntegerField(default=0)
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['ordre_affichage', 'nom']
        unique_together = ('garage', 'nom')
        db_table = 'garages_serviceoffert'

    def __str__(self):
        return f"{self.nom} - {self.garage.name}"

