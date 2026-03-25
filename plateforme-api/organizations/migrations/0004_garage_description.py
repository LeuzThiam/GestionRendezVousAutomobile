from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('garages', '0003_disponibilitegarage'),
    ]

    operations = [
        migrations.AddField(
            model_name='garage',
            name='description',
            field=models.TextField(blank=True),
        ),
    ]
