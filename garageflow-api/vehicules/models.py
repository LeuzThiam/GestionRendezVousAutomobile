# models.py
from django.db import models
from django.contrib.auth.models import User

class Vehicule(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    garage = models.ForeignKey(
        'garages.Garage',
        on_delete=models.SET_NULL,
        related_name='vehicules',
        null=True,
        blank=True,
    )
    marque = models.CharField(max_length=100)
    modele = models.CharField(max_length=100)
    annee = models.PositiveIntegerField()
    vin = models.CharField(max_length=50, blank=True, null=True)

    # Ajouter ces deux champs (avec des tailles et noms adaptés à votre besoin)
    body_class = models.CharField(max_length=100, blank=True, null=True)
    vehicle_type = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.marque} {self.modele} ({self.annee})"
