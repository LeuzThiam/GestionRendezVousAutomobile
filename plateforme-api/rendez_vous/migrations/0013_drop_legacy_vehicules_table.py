from django.db import migrations


class Migration(migrations.Migration):
    """No-op : la table vehicules_vehicule est supprimée par vehicules.0002_delete_vehicule."""

    dependencies = [
        ('rendezVous', '0012_remove_rendezvous_vehicule'),
        ('vehicules', '0002_delete_vehicule'),
    ]

    operations = []
