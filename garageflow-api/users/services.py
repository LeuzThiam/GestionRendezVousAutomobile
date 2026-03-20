from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.utils import timezone


ALLOWED_PROFILE_ROLES = {'owner', 'client', 'mecanicien'}


def normalize_profile_role(role, default='client'):
    return role if role in ALLOWED_PROFILE_ROLES else default


def get_user_profile(user):
    return getattr(user, 'profile', None)


def get_user_garage(user):
    profile = get_user_profile(user)
    return getattr(profile, 'garage', None)


def get_user_role(user):
    profile = get_user_profile(user)
    return getattr(profile, 'role', None)


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


def create_basic_user(*, username, email, first_name, last_name, password):
    user = User(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
    )
    user.set_password(password)
    user.save()
    return user


def update_user_and_profile(user, *, first_name=None, last_name=None, email=None, role=None, garage=None, date_naissance=None):
    if first_name is not None:
        user.first_name = first_name
    if last_name is not None:
        user.last_name = last_name
    if email is not None:
        user.email = email
    user.save()

    profile = user.profile
    if role is not None:
        profile.role = normalize_profile_role(role, default=profile.role)
    if garage is not None or profile.role == 'client':
        profile.garage = garage
    if date_naissance is not None:
        profile.date_naissance = date_naissance
    profile.save()
    return user


def assign_profile(user, *, role, garage=None, date_naissance=None):
    profile = user.profile
    profile.role = normalize_profile_role(role)
    profile.garage = garage if profile.role != 'client' else None
    if date_naissance is not None:
        profile.date_naissance = date_naissance
    profile.save()
    return profile


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
