from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rendezVous', '0005_rendezvous_garage'),
    ]

    operations = [
        migrations.AlterField(
            model_name='rendezvous',
            name='mecanicien',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.CASCADE,
                related_name='rendezvous_mecanicien',
                to='auth.user',
            ),
        ),
    ]
