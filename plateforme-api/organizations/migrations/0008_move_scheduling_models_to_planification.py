from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('garages', '0007_alter_serviceoffert_options'),
        ('planification', '0001_initial'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.DeleteModel(name='DisponibiliteGarage'),
                migrations.DeleteModel(name='FermetureExceptionnelleGarage'),
            ],
        ),
    ]
