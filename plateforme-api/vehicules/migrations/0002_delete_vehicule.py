from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('vehicules', '0001_initial'),
        ('rendezVous', '0012_remove_rendezvous_vehicule'),
    ]

    operations = [
        migrations.DeleteModel(name='Vehicule'),
    ]
