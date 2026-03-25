import django.db.models.deletion
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('rendezVous', '0011_move_reprogrammation_to_reprogrammations'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='rendezvous',
            name='vehicule',
        ),
    ]
