# Architecture backend modulaire

Le backend est organisé en applications Django métier. Le projet Python s’appelle toujours `garageflow_api` (paramètres, WSGI) ; le code métier « établissement » vit dans le package `organizations/` avec **label d’app Django `garages`** pour conserver la compatibilité avec l’historique des migrations (`django_migrations`, clés étrangères).

## Applications métier actives

- `comptes`
- `organizations` (dossier `organizations/`, label `garages`)
- `personnel`
- `planification`
- `prestations`
- `reprogrammations`
- `rendez_vous`
- `users`
- `vehicules` ( périmètre historique / migrations )

## Objectif

Séparer les responsabilités :

- authentification et profils (`comptes`, `users`)
- identité et ressources de l’établissement (`organizations`)
- personnel et disponibilités mécaniciens (`personnel`)
- règles de planning réutilisables (`planification`)
- catalogue de prestations (`prestations`)
- historique de reprogrammation (`reprogrammations`)
- cycle de vie des rendez-vous (`rendez_vous`)

## Répartition actuelle (résumé)

### `comptes`

- Inscription client / propriétaire, login JWT, utilisateur courant, profil.
- Routes typiques : `/api/auth/...`, `/api/comptes/...`

### `organizations`

- Modèle **Organization** (table SQL `garages_garage`), fiche publique, profil « moi » propriétaire.
- Services, disponibilités, fermetures, catégories : exposés via le routeur sous `/api/organizations/` (détail dans `organizations/urls.py`).

### `personnel`

- Mécaniciens côté propriétaire, disponibilités par mécanicien.

### `planification`

- Modèles et services liés aux créneaux (disponibilités, fermetures peuvent être référencés depuis `organizations` selon l’implémentation actuelle).

### `prestations`

- Catégories et services offerts (liés à l’établissement).

### `reprogrammations`

- Propositions, contre-propositions, historique.

### `rendez_vous`

- Modèle `RendezVous`, statuts, lien client ↔ établissement (champ modèle `garage` vers `Organization`), service, mécanicien.

## API principale (racine `garageflow_api/urls.py`)

- ` /api/auth/`
- ` /api/comptes/`
- ` /api/organizations/`
- ` /api/users/`
- ` /api/personnel/`
- ` /api/rendezvous/`

Les réponses JSON exposent la terminologie **organization** là où le sérialiseur découple l’API des noms de champs internes.

## Compatibilité et maintenance

- Conserver le label d’app `garages` tant que les migrations historiques n’ont pas été fusionnées / renommées.
- Ajouter la logique métier dans l’application concernée ; garder les vues fines et les règles partagées dans des modules `services.py` lorsque pertinent.

## Références

- [Cahier des charges](cahier-des-charges.md)
- Code : `plateforme-api/`
