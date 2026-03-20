from .models import RendezVous


def get_rendezvous_queryset_for_user(user):
    queryset = RendezVous.objects.all()
    profile = getattr(user, 'profile', None)
    role = getattr(profile, 'role', None)
    garage = getattr(profile, 'garage', None)

    if garage is not None:
        queryset = queryset.filter(garage=garage)

    if role == 'client':
        return queryset.filter(client=user)
    if role == 'mecanicien':
        return queryset.filter(mecanicien=user)
    return queryset


def get_rendezvous_creation_payload(user):
    return {
        'client': user,
    }
