from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('garages', '0009_move_service_model_to_prestations'),
    ]

    operations = [
        migrations.AddField(
            model_name='garage',
            name='type_etablissement',
            field=models.CharField(
                choices=[('automobile', 'Automobile / mecanique'), ('multi_services', 'Multi-services (prestations variees)')],
                default='automobile',
                max_length=20,
            ),
        ),
    ]
