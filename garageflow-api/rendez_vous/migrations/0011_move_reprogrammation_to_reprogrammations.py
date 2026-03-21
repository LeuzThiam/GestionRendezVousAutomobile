from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('reprogrammations', '0001_initial'),
        ('rendezVous', '0010_reprogrammationproposition'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.DeleteModel(name='ReprogrammationProposition'),
            ],
        ),
    ]
