from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('garages', '0002_serviceoffert'),
        ('rendezVous', '0006_alter_rendezvous_mecanicien'),
    ]

    operations = [
        migrations.AddField(
            model_name='rendezvous',
            name='service',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='rendezvous', to='garages.serviceoffert'),
        ),
    ]
