"""Categories par defaut selon le type d etablissement."""

DEFAULT_AUTO_CATEGORIES = (
    ('entretien', 'Entretien', 0),
    ('diagnostic', 'Diagnostic', 1),
    ('reparation', 'Reparation', 2),
    ('urgence', 'Urgence', 3),
)

DEFAULT_MULTI_SERVICES_CATEGORIES = (
    ('consultation', 'Consultation', 0),
    ('prestation', 'Prestation', 1),
    ('atelier', 'Atelier / technique', 2),
    ('autre', 'Autre', 3),
)


def seed_default_categories_for_garage(garage):
    from prestations.models import CategoriePrestation

    specs = (
        DEFAULT_MULTI_SERVICES_CATEGORIES
        if garage.type_etablissement == 'multi_services'
        else DEFAULT_AUTO_CATEGORIES
    )
    for slug, nom, ordre in specs:
        CategoriePrestation.objects.get_or_create(
            garage=garage,
            slug=slug,
            defaults={'nom': nom, 'ordre': ordre},
        )
