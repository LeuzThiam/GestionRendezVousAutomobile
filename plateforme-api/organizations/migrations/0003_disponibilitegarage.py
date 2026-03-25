from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('garages', '0002_serviceoffert'),
    ]

    operations = [
        migrations.CreateModel(
            name='DisponibiliteGarage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('jour_semaine', models.PositiveSmallIntegerField(choices=[(0, 'Lundi'), (1, 'Mardi'), (2, 'Mercredi'), (3, 'Jeudi'), (4, 'Vendredi'), (5, 'Samedi'), (6, 'Dimanche')])),
                ('heure_debut', models.TimeField()),
                ('heure_fin', models.TimeField()),
                ('actif', models.BooleanField(default=True)),
                ('garage', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='disponibilites', to='garages.garage')),
            ],
            options={
                'ordering': ['jour_semaine', 'heure_debut'],
            },
        ),
    ]
