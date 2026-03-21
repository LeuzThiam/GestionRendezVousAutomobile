# Architecture backend modulaire

La refonte backend est maintenant organisee autour d'apps metier plus petites, avec une couche de compatibilite limitee pour les anciennes routes.

## Apps metier actives

- `comptes`
- `personnel`
- `planification`
- `prestations`
- `reprogrammations`
- `garages`
- `rendez_vous`
- `vehicules`

## Objectif

Sortir du regroupement historique entre `users`, `garages` et `rendez_vous` afin de :

- separer l'authentification et les comptes
- isoler la gestion du personnel
- centraliser les regles de planning
- decoupler le catalogue de prestations
- sortir l'historique de reprogrammation du coeur du rendez-vous

## Repartition actuelle

### `comptes`

Responsable de :

- inscription client et proprietaire
- connexion et JWT
- utilisateur courant
- profil utilisateur
- mise a jour du compte
- role et liaison au garage

Routes principales :

- `/api/auth/register/`
- `/api/auth/register/owner/`
- `/api/auth/register/client/`
- `/api/auth/login/`
- `/api/auth/refresh/`
- `/api/auth/logout/`
- `/api/auth/me/`
- `/api/comptes/profile/`
- `/api/comptes/profile/update/`

Modeles :

- `Profile`

### `personnel`

Responsable de :

- liste des mecaniciens d'un garage
- creation, mise a jour et suppression
- disponibilites des mecaniciens
- permissions proprietaire sur les ressources internes

Routes principales :

- `/api/personnel/mecaniciens/`
- `/api/personnel/owner/mecaniciens/`
- `/api/personnel/owner/mecaniciens/<id>/`
- `/api/personnel/owner/mecaniciens/disponibilites/`

Modeles :

- `MecanicienDisponibilite`

### `planification`

Responsable de :

- disponibilites du garage
- fermetures exceptionnelles
- regles de verification de creneaux reutilisables par les rendez-vous

Routes principales :

- `/api/planification/garages/me/disponibilites/`
- `/api/planification/garages/me/fermetures/`

Modeles :

- `DisponibiliteGarage`
- `FermetureExceptionnelleGarage`

### `prestations`

Responsable de :

- catalogue de services du garage
- categories
- prix indicatif
- duree estimee
- ordre d'affichage

Routes principales :

- `/api/prestations/garages/me/services/`

Modeles :

- `ServiceOffert`

### `reprogrammations`

Responsable de :

- propositions client
- contre-propositions garage
- historique de reprogrammation
- notes internes
- etats de reponse

Modeles :

- `ReprogrammationProposition`

### `garages`

Responsable de :

- l'identite du garage
- la fiche publique
- le garage courant

Modele :

- `Garage`

### `rendez_vous`

Responsable de :

- le coeur du cycle de vie des rendez-vous
- les statuts
- la confirmation, le refus et la cloture
- le lien entre client, garage, vehicule, prestation et mecanicien

Modele :

- `RendezVous`

## Compatibilite legacy

Les endpoints historiques existent encore pour eviter de casser l'application pendant la transition :

- `/api/users/...`
- `/api/garages/me/disponibilites/...`
- `/api/garages/me/fermetures/...`
- `/api/garages/me/services/...`

Ces modules legacy sont maintenant des facades minces qui deleguent vers les apps metier.

## Nettoyage restant

Le gros de la refonte est termine. Ce qu'il reste surtout :

- alleger encore certains imports de compatibilite dans `users`, `garages` et `rendez_vous`
- supprimer les facades legacy quand plus rien ne les consomme
- garder les tests branches sur les apps metier plutot que sur les alias historiques

## Regles de maintenance

- ajouter la logique metier dans l'app de domaine concernee
- garder les views minces
- privilegier `services.py` pour les regles de domaine partagees
- eviter de remettre de la logique de planning dans `rendez_vous`
- eviter de remettre de la logique mecanicien dans `comptes`
