from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('rendezVous', '0008_rendezvous_requested_date'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='rendezvous',
            name='confirmed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='rendezvous',
            name='confirmed_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='rendezvous_confirmed_actions', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='rendezvous',
            name='rejected_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='rendezvous',
            name='rejected_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='rendezvous_rejected_actions', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='rendezvous',
            name='reprogrammed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='rendezvous',
            name='reprogrammed_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='rendezvous_reprogrammed_actions', to=settings.AUTH_USER_MODEL),
        ),
    ]
