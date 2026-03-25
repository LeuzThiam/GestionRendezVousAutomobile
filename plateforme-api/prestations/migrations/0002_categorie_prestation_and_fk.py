import django.db.models.deletion
from django.db import migrations, models


def seed_categories_et_lier_services(apps, schema_editor):
    Garage = apps.get_model('garages', 'Garage')
    CategoriePrestation = apps.get_model('prestations', 'CategoriePrestation')
    ServiceOffert = apps.get_model('prestations', 'ServiceOffert')

    legacy_specs = (
        ('entretien', 'Entretien', 0),
        ('diagnostic', 'Diagnostic', 1),
        ('reparation', 'Reparation', 2),
        ('urgence', 'Urgence', 3),
    )

    for garage in Garage.objects.all():
        for slug, nom, ordre in legacy_specs:
            CategoriePrestation.objects.get_or_create(
                garage_id=garage.id,
                slug=slug,
                defaults={'nom': nom, 'ordre': ordre},
            )

    for service in ServiceOffert.objects.all():
        cat = CategoriePrestation.objects.get(
            garage_id=service.garage_id,
            slug=service.categorie_legacy,
        )
        service.categorie_id = cat.id
        service.save(update_fields=['categorie_id'])


class Migration(migrations.Migration):

    dependencies = [
        ('prestations', '0001_initial'),
        ('garages', '0010_garage_type_etablissement'),
    ]

    operations = [
        migrations.CreateModel(
            name='CategoriePrestation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=80)),
                ('slug', models.SlugField(max_length=100)),
                ('ordre', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'garage',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='categories_prestations',
                        to='garages.garage',
                    ),
                ),
            ],
            options={
                'db_table': 'prestations_categorieprestation',
                'ordering': ['ordre', 'nom'],
                'unique_together': {('garage', 'slug')},
            },
        ),
        migrations.RenameField(
            model_name='serviceoffert',
            old_name='categorie',
            new_name='categorie_legacy',
        ),
        migrations.AddField(
            model_name='serviceoffert',
            name='categorie',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='services',
                to='prestations.categorieprestation',
            ),
        ),
        migrations.RunPython(seed_categories_et_lier_services, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name='serviceoffert',
            name='categorie_legacy',
        ),
        migrations.AlterField(
            model_name='serviceoffert',
            name='categorie',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='services',
                to='prestations.categorieprestation',
            ),
        ),
    ]
