from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rendezVous', '0007_rendezvous_service'),
    ]

    operations = [
        migrations.AddField(
            model_name='rendezvous',
            name='requested_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
