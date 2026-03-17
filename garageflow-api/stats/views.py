# stats/views.py

from django.shortcuts import render
from django.contrib.auth.models import User
from django.db.models import Count, Sum
# Importez vos modèles si besoin (Profile, Vehicule, RendezVous, Facture, etc.)
from users.models import Profile
from vehicules.models import Vehicule
from rendezVous.models import RendezVous
from factures.models import Facture

def stats_view(request):
    """
    Vue qui génère une page HTML avec quelques statistiques.
    """
    total_users = User.objects.count()
    total_clients = Profile.objects.filter(role='client').count()
    total_mecaniciens = Profile.objects.filter(role='mecanicien').count()

    total_vehicules = Vehicule.objects.count()
    total_rendezvous = RendezVous.objects.count()
    total_factures = Facture.objects.count()

    # Exemple d'une somme de montants
    total_paiements = Facture.objects.aggregate(Sum('montant'))['montant__sum'] or 0

    context = {
        'total_users': total_users,
        'total_clients': total_clients,
        'total_mecaniciens': total_mecaniciens,
        'total_vehicules': total_vehicules,
        'total_rendezvous': total_rendezvous,
        'total_factures': total_factures,
        'total_paiements': total_paiements,
    }
    return render(request, 'stats/stats.html', context)
