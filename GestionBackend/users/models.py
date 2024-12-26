from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    ROLE_CHOICES = (
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
    date_naissance = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"
