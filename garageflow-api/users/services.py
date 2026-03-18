from django.contrib.auth.models import User


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
    queryset = User.objects.filter(profile__role='mecanicien')
    if garage is not None:
        queryset = queryset.filter(profile__garage=garage)
    return queryset


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
    if garage is not None:
        profile.garage = garage
    if date_naissance is not None:
        profile.date_naissance = date_naissance
    profile.save()
    return user


def assign_profile(user, *, role, garage=None, date_naissance=None):
    profile = user.profile
    profile.role = normalize_profile_role(role)
    if garage is not None:
        profile.garage = garage
    if date_naissance is not None:
        profile.date_naissance = date_naissance
    profile.save()
    return profile


def create_mecanicien_for_garage(*, garage, username, email, first_name, last_name, password):
    user = create_basic_user(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        password=password,
    )
    assign_profile(user, role='mecanicien', garage=garage)
    return user
