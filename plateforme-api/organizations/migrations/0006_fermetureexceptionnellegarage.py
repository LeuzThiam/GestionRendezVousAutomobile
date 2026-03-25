from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('garages', '0005_serviceoffert_categorie_ordre_affichage'),
    ]

    operations = [
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
            },
        ),
    ]
