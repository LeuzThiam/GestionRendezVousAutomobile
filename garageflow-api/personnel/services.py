from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.utils import timezone

from comptes.services import assign_profile, create_basic_user


def list_mecaniciens_for_garage(garage):
    if garage is None:
        return User.objects.none()
    today = timezone.localdate()
    return User.objects.filter(profile__role='mecanicien', profile__garage=garage).annotate(
        rdv_confirmed_count=Count('rendezvous_mecanicien', filter=Q(rendezvous_mecanicien__status='confirmed'), distinct=True),
        rdv_today_count=Count(
            'rendezvous_mecanicien',
            filter=Q(rendezvous_mecanicien__status='confirmed', rendezvous_mecanicien__date__date=today),
            distinct=True,
        ),
        rdv_upcoming_count=Count(
            'rendezvous_mecanicien',
            filter=Q(rendezvous_mecanicien__status='confirmed', rendezvous_mecanicien__date__date__gte=today),
            distinct=True,
        ),
    )


def create_mecanicien_for_garage(*, garage, username, email, first_name, last_name, password, specialites=''):
    user = create_basic_user(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        password=password,
    )
    profile = assign_profile(user, role='mecanicien', garage=garage)
    profile.specialites = specialites
    profile.save()
    return user

