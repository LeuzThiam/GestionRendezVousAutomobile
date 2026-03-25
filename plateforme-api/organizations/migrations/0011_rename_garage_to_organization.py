from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('garages', '0010_garage_type_etablissement'),
        ('comptes', '0001_initial'),
        ('planification', '0001_initial'),
        ('prestations', '0002_categorie_prestation_and_fk'),
        ('rendezVous', '0005_rendezvous_garage'),
        ('users', '0002_profile_garage'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='Garage',
            new_name='Organization',
        ),
        migrations.AlterModelTable(
            name='Organization',
            table='garages_garage',
        ),
    ]
