from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('garages', '0007_alter_serviceoffert_options'),
        ('users', '0005_alter_profile_role'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name='Profile',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('role', models.CharField(choices=[('owner', 'Proprietaire'), ('client', 'Client'), ('mecanicien', 'Mécanicien')], default='client', max_length=20)),
                        ('specialites', models.CharField(blank=True, max_length=255)),
                        ('date_naissance', models.DateField(blank=True, null=True)),
                        ('garage', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='profiles', to='garages.garage')),
                        ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL)),
                    ],
                    options={
                        'db_table': 'users_profile',
                    },
                ),
            ],
        ),
    ]

