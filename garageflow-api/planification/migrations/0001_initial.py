from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('garages', '0007_alter_serviceoffert_options'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
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
                        'db_table': 'garages_disponibilitegarage',
                    },
                ),
                migrations.CreateModel(
                    name='FermetureExceptionnelleGarage',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('date', models.DateField()),
                        ('toute_la_journee', models.BooleanField(default=True)),
                        ('heure_debut', models.TimeField(blank=True, null=True)),
                        ('heure_fin', models.TimeField(blank=True, null=True)),
                        ('raison', models.CharField(blank=True, max_length=255)),
                        ('actif', models.BooleanField(default=True)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('garage', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='fermetures_exceptionnelles', to='garages.garage')),
                    ],
                    options={
                        'ordering': ['date', 'heure_debut'],
                        'db_table': 'garages_fermetureexceptionnellegarage',
                    },
                ),
            ],
        ),
    ]
