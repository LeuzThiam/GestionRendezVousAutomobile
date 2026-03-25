from django.db.models.signals import post_save
from django.dispatch import receiver

from organizations.models import Organization

from prestations.seed import seed_default_categories_for_garage


@receiver(post_save, sender=Organization)
def creer_categories_defaut_garage(sender, instance, created, **kwargs):
    if created:
        seed_default_categories_for_garage(instance)
