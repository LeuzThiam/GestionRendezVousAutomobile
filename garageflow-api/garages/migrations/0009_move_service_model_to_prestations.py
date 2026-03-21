from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('prestations', '0001_initial'),
        ('garages', '0008_move_scheduling_models_to_planification'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.DeleteModel(name='ServiceOffert'),
            ],
        ),
    ]
