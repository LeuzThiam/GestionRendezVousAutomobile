from django.utils import timezone

from rendez_vous.models import RendezVous
from personnel.models import MecanicienDisponibilite
from planification.models import DisponibiliteGarage, FermetureExceptionnelleGarage


def get_current_user_garage(user):
    return getattr(getattr(user, 'profile', None), 'garage', None)


def get_garage_disponibilites_queryset(garage):
    return DisponibiliteGarage.objects.filter(garage=garage)


def get_garage_fermetures_queryset(garage):
    return FermetureExceptionnelleGarage.objects.filter(garage=garage)


def garage_has_active_slot(garage, date):
    if garage is None or date is None:
        return False
    local_date = timezone.localtime(date)
    weekday = local_date.weekday()
    current_time = local_date.time().replace(second=0, microsecond=0)
    return DisponibiliteGarage.objects.filter(
        garage=garage,
        actif=True,
        jour_semaine=weekday,
        heure_debut__lte=current_time,
        heure_fin__gte=current_time,
    ).exists()


def mecanicien_has_active_slot(mecanicien, date):
    if mecanicien is None or date is None:
        return False

    local_date = timezone.localtime(date)
    weekday = local_date.weekday()
    current_time = local_date.time().replace(second=0, microsecond=0)
    disponibilites = MecanicienDisponibilite.objects.filter(
        mecanicien=mecanicien,
        actif=True,
    )

    if not disponibilites.exists():
        return True

    return disponibilites.filter(
        jour_semaine=weekday,
        heure_debut__lte=current_time,
        heure_fin__gte=current_time,
    ).exists()


def mecanicien_has_conflict(mecanicien, date, instance=None):
    if mecanicien is None or date is None:
        return False
    queryset = RendezVous.objects.filter(
        mecanicien=mecanicien,
        date=date,
        status='confirmed',
    )
    if instance is not None:
        queryset = queryset.exclude(pk=instance.pk)
    return queryset.exists()
