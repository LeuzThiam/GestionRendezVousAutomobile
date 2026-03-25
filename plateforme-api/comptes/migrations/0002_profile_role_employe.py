from django.db import migrations, models


def role_mecanicien_to_employe(apps, schema_editor):
    Profile = apps.get_model('comptes', 'Profile')
    Profile.objects.filter(role='mecanicien').update(role='employe')


def role_employe_to_mecanicien(apps, schema_editor):
    Profile = apps.get_model('comptes', 'Profile')
    Profile.objects.filter(role='employe').update(role='mecanicien')


class Migration(migrations.Migration):

    dependencies = [
        ('comptes', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(role_mecanicien_to_employe, role_employe_to_mecanicien),
        migrations.AlterField(
            model_name='profile',
            name='role',
            field=models.CharField(
                choices=[
                    ('owner', 'Proprietaire'),
                    ('client', 'Client'),
                    ('employe', 'Employe'),
                ],
                default='client',
                max_length=20,
            ),
        ),
    ]
