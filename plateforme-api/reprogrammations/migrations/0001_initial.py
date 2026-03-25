from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('rendezVous', '0010_reprogrammationproposition'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name='ReprogrammationProposition',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('proposed_date', models.DateTimeField()),
                        ('proposal_type', models.CharField(choices=[('client_request', 'Proposition client'), ('garage_counter', 'Contre-proposition garage')], max_length=30)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('internal_note', models.TextField(blank=True)),
                        ('response_status', models.CharField(choices=[('pending', 'En attente'), ('accepted', 'Acceptee'), ('rejected', 'Refusee'), ('superseded', 'Remplacee')], default='pending', max_length=20)),
                        ('responded_at', models.DateTimeField(blank=True, null=True)),
                        ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reprogrammation_propositions_creees', to=settings.AUTH_USER_MODEL)),
                        ('responded_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reprogrammation_propositions_traitees', to=settings.AUTH_USER_MODEL)),
                        ('rendez_vous', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reprogrammation_propositions', to='rendezVous.rendezvous')),
                    ],
                    options={
                        'ordering': ['-created_at'],
                        'db_table': 'rendezVous_reprogrammationproposition',
                    },
                ),
            ],
        ),
    ]
