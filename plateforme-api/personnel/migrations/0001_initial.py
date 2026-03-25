from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('users', '0005_alter_profile_role'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name='MecanicienDisponibilite',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('jour_semaine', models.PositiveSmallIntegerField(choices=[(0, 'Lundi'), (1, 'Mardi'), (2, 'Mercredi'), (3, 'Jeudi'), (4, 'Vendredi'), (5, 'Samedi'), (6, 'Dimanche')])),
                        ('heure_debut', models.TimeField()),
                        ('heure_fin', models.TimeField()),
                        ('actif', models.BooleanField(default=True)),
                        ('mecanicien', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='disponibilites', to=settings.AUTH_USER_MODEL)),
                    ],
                    options={
                        'ordering': ['mecanicien__username', 'jour_semaine', 'heure_debut'],
                        'db_table': 'users_mecaniciendisponibilite',
                    },
                ),
            ],
        ),
    ]

