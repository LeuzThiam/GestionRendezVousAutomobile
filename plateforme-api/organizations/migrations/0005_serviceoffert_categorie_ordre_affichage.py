from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('garages', '0004_garage_description'),
    ]

    operations = [
        migrations.AddField(
            model_name='serviceoffert',
            name='categorie',
            field=models.CharField(
                choices=[
                    ('entretien', 'Entretien'),
                    ('diagnostic', 'Diagnostic'),
                    ('reparation', 'Reparation'),
                    ('urgence', 'Urgence'),
                ],
                default='entretien',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='serviceoffert',
            name='ordre_affichage',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
