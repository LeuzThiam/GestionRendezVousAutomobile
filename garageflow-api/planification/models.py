from django.db import models


class DisponibiliteGarage(models.Model):
    DAY_CHOICES = (
        (0, 'Lundi'),
        (1, 'Mardi'),
        (2, 'Mercredi'),
        (3, 'Jeudi'),
        (4, 'Vendredi'),
        (5, 'Samedi'),
        (6, 'Dimanche'),
    )

    garage = models.ForeignKey(
        'garages.Garage',
        on_delete=models.CASCADE,
        related_name='disponibilites',
    )
    jour_semaine = models.PositiveSmallIntegerField(choices=DAY_CHOICES)
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    actif = models.BooleanField(default=True)

    class Meta:
        ordering = ['jour_semaine', 'heure_debut']
        db_table = 'garages_disponibilitegarage'

    def __str__(self):
        return f"{self.get_jour_semaine_display()} {self.heure_debut}-{self.heure_fin}"


class FermetureExceptionnelleGarage(models.Model):
    garage = models.ForeignKey(
        'garages.Garage',
        on_delete=models.CASCADE,
        related_name='fermetures_exceptionnelles',
    )
    date = models.DateField()
    toute_la_journee = models.BooleanField(default=True)
    heure_debut = models.TimeField(null=True, blank=True)
    heure_fin = models.TimeField(null=True, blank=True)
    raison = models.CharField(max_length=255, blank=True)
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', 'heure_debut']
        db_table = 'garages_fermetureexceptionnellegarage'

    def __str__(self):
        return f"Fermeture {self.garage.name} - {self.date}"

