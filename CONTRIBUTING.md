# Workflow Git du projet

Ce depot contient deux zones de travail:

- `GestionBackend/` pour l'API Django
- `TravailPratique01/gestion-reparation-automobile/` pour le frontend React

## Branches

- `master`: branche de reference stable
- `dev`: integration des travaux valides avant passage sur `master`
- `feature/...`: nouvelle fonctionnalite
- `fix/...`: correction de bug

## Regle de travail

Ne pas coder directement sur `master`.

### Demarrer une tache

```bash
git checkout master
git pull origin master
git checkout -b feature/auth-config-hardening
```

### Nommage recommande

- `feature/frontend-auth`
- `feature/backend-rendezvous-validation`
- `fix/profile-update-api`
- `fix/routes-protegees`

### Commits

Un commit doit porter une seule idee.

Exemples adaptes au projet:

- `ajout protection des routes client et mecanicien`
- `correction contrat api profil utilisateur`
- `externalisation config django par variables d environnement`

### Push et Pull Request

```bash
git push origin feature/auth-config-hardening
```

Puis ouvrir une Pull Request vers `dev` ou `master` selon l'organisation choisie.

## Controle avant PR

### Backend Django

Executer depuis `GestionBackend/`:

```bash
python manage.py test
```

### Frontend React

Executer depuis `TravailPratique01/gestion-reparation-automobile/`:

```bash
npm install
npm run build
```

## Repartition simple en equipe

- frontend: pages React, Redux, styles, navigation
- backend: models, serializers, views, permissions, tests API

Chacun travaille sur sa branche, puis soumet une PR relue avant merge.
