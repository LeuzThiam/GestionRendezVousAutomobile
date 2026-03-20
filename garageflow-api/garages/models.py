from django.contrib.auth.models import User
from django.db import models
from django.utils.text import slugify


class Garage(models.Model):
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=160, unique=True)
    owner = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='owned_garage',
    )
    phone = models.CharField(max_length=30, blank=True)
    address = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ServiceOffert(models.Model):
    CATEGORY_CHOICES = (
        ('entretien', 'Entretien'),
        ('diagnostic', 'Diagnostic'),
        ('reparation', 'Reparation'),
        ('urgence', 'Urgence'),
    )

    garage = models.ForeignKey(
        Garage,
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

    def __str__(self):
        return f"{self.nom} - {self.garage.name}"


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
        Garage,
        on_delete=models.CASCADE,
        related_name='disponibilites',
    )
    jour_semaine = models.PositiveSmallIntegerField(choices=DAY_CHOICES)
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    actif = models.BooleanField(default=True)

    class Meta:
        ordering = ['jour_semaine', 'heure_debut']

    def __str__(self):
        return f"{self.get_jour_semaine_display()} {self.heure_debut}-{self.heure_fin}"
