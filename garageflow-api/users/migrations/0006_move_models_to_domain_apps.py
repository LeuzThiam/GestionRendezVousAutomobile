from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('comptes', '0001_initial'),
        ('personnel', '0001_initial'),
        ('users', '0005_alter_profile_role'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.DeleteModel(name='MecanicienDisponibilite'),
                migrations.DeleteModel(name='Profile'),
            ],
        ),
    ]
