from django.conf import settings
from django.db import models


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
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='disponibilites',
    )
    jour_semaine = models.PositiveSmallIntegerField(choices=DAY_CHOICES)
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    actif = models.BooleanField(default=True)

    class Meta:
        ordering = ['mecanicien__username', 'jour_semaine', 'heure_debut']
        db_table = 'users_mecaniciendisponibilite'

    def __str__(self):
        return f"{self.mecanicien.username} - {self.get_jour_semaine_display()} {self.heure_debut}-{self.heure_fin}"

