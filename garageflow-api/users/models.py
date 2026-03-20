from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
    ROLE_CHOICES = (
        ('owner', 'Proprietaire'),
        ('client', 'Client'),
        ('mecanicien', 'Mécanicien'),
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='client'
    )
    garage = models.ForeignKey(
        'garages.Garage',
        on_delete=models.SET_NULL,
        related_name='profiles',
        null=True,
        blank=True,
    )
    date_naissance = models.DateField(null=True, blank=True)

    def __str__(self):
        if self.garage_id:
            return f"{self.user.username} ({self.role}) - {self.garage.name}"
        return f"{self.user.username} ({self.role})"


class MecanicienDisponibilite(models.Model):
    DAY_CHOICES = (
        (0, 'Lundi'),
        (1, 'Mardi'),
        (2, 'Mercredi'),
        (3, 'Jeudi'),
        (4, 'Vendredi'),
        (5, 'Samedi'),
        (6, 'Dimanche'),
    )

    mecanicien = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='disponibilites',
    )
    jour_semaine = models.PositiveSmallIntegerField(choices=DAY_CHOICES)
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    actif = models.BooleanField(default=True)

    class Meta:
        ordering = ['mecanicien__username', 'jour_semaine', 'heure_debut']

    def __str__(self):
        return f"{self.mecanicien.username} - {self.get_jour_semaine_display()} {self.heure_debut}-{self.heure_fin}"
