from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_mecaniciendisponibilite'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='specialites',
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
