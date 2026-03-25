from .models import RendezVous


def get_rendezvous_queryset_for_user(user):
    queryset = RendezVous.objects.select_related(
        'garage',
        'client',
        'mecanicien',
        'service',
        'confirmed_by',
        'rejected_by',
        'reprogrammed_by',
    ).prefetch_related(
        'reprogrammation_propositions',
        'reprogrammation_propositions__created_by',
        'reprogrammation_propositions__responded_by',
    )
    profile = getattr(user, 'profile', None)
    role = getattr(profile, 'role', None)
    garage = getattr(profile, 'garage', None)

    if garage is not None:
        queryset = queryset.filter(garage=garage)

    if role == 'client':
        return queryset.filter(client=user)
    if role == 'employe':
        return queryset.filter(mecanicien=user)
    return queryset


def get_rendezvous_creation_payload(user):
    return {
        'client': user,
    }
