from django.apps import AppConfig


class OrganizationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'organizations'
    label = 'garages'  # historique django_migrations / FK to='garages.*'
