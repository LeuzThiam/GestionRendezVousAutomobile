from django.db import models
from django.utils.text import slugify


class CategoriePrestation(models.Model):
    garage = models.ForeignKey(
        'garages.Organization',
        on_delete=models.CASCADE,
        related_name='categories_prestations',
    )
    nom = models.CharField(max_length=80)
    slug = models.SlugField(max_length=100)
    ordre = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['ordre', 'nom']
        unique_together = [('garage', 'slug')]
        db_table = 'prestations_categorieprestation'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nom)[:100]
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nom} ({self.garage.name})"


class ServiceOffert(models.Model):
    garage = models.ForeignKey(
        'garages.Organization',
        on_delete=models.CASCADE,
        related_name='services',
    )
    categorie = models.ForeignKey(
        CategoriePrestation,
        on_delete=models.PROTECT,
        related_name='services',
    )
    nom = models.CharField(max_length=150)
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
