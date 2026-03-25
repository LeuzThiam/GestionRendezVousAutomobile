import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Vehicule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('marque', models.CharField(max_length=100)),
                ('modele', models.CharField(max_length=100)),
                ('annee', models.PositiveIntegerField()),
                ('client', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='vehicules', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
