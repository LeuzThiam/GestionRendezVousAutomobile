# users/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Profile

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Quand un User est créé, on crée automatiquement un Profile associé.
    """
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Quand un User est sauvegardé, on s’assure de sauvegarder le Profile.
    """
    if hasattr(instance, 'profile'):
        instance.profile.save()
