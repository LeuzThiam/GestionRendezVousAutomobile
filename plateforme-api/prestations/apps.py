from django.apps import AppConfig


class PrestationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'prestations'

    def ready(self):
        import prestations.signals  # noqa: F401

