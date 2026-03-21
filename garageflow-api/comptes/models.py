from django.conf import settings
from django.db import models


class Profile(models.Model):
    ROLE_CHOICES = (
        ('owner', 'Proprietaire'),
        ('client', 'Client'),
        ('mecanicien', 'Mécanicien'),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
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
    specialites = models.CharField(max_length=255, blank=True)
    date_naissance = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'users_profile'

    def __str__(self):
        if self.garage_id:
            return f"{self.user.username} ({self.role}) - {self.garage.name}"
        return f"{self.user.username} ({self.role})"

