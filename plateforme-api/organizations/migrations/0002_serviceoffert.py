from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('garages', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ServiceOffert',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=150)),
                ('description', models.TextField(blank=True)),
                ('duree_estimee', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('prix_indicatif', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('actif', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('garage', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='services', to='garages.garage')),
            ],
            options={
                'ordering': ['nom'],
                'unique_together': {('garage', 'nom')},
            },
        ),
    ]
