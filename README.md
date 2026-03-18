# GestionRendezVousAutomobile

Application SaaS MVP de gestion de garage automobile, composee de deux projets:

- `garageflow-api/` : backend Django REST
- `garageflow-web/` : frontend React avec Vite

Le produit est pense pour un mode multi-garage:

- un proprietaire cree son garage
- il gere son equipe mecanique
- ses clients reservent des rendez-vous
- les donnees restent separees par garage

## Architecture

### Backend

Le backend est organise autour de domaines metier simples:

- `garages`
- `users`
- `vehicules`
- `rendez_vous`

Fonctions principales:

- authentification JWT
- inscription d un proprietaire de garage
- gestion du profil utilisateur
- gestion des mecaniciens par garage
- gestion des vehicules
- gestion des rendez-vous
- filtrage des donnees par garage

### Frontend

Le frontend repose sur:

- React 18
- React Router
- React Bootstrap
- Axios
- une couche `src/api/` par domaine
- un `AuthContext` pour la session utilisateur

Le frontend ne depend plus de Redux.

## Fonctionnalites MVP

### Proprietaire

- inscription avec creation du garage
- connexion
- tableau de bord garage
- lien public de reservation
- gestion des mecaniciens

### Client

- connexion
- gestion des vehicules
- prise de rendez-vous
- consultation de ses rendez-vous

### Mecanicien

- connexion
- consultation et traitement de ses rendez-vous

## Endpoints principaux

### Authentification

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`

### Garage

- `GET /api/garages/me/`
- `GET /api/garages/public/<slug>/`

### Metier

- `GET /api/users/mecaniciens/`
- `GET /api/users/owner/mecaniciens/`
- `POST /api/users/owner/mecaniciens/`
- `DELETE /api/users/owner/mecaniciens/<id>/`
- `GET /api/vehicules/`
- `POST /api/vehicules/`
- `PUT /api/vehicules/<id>/`
- `DELETE /api/vehicules/<id>/`
- `GET /api/rendezvous/`
- `POST /api/rendezvous/`
- `PATCH /api/rendezvous/<id>/`

## Demarrage local

## Backend Django

Depuis `garageflow-api/`:

```bash
python -m venv env
env\Scripts\activate
pip install -r requirements-ci.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Le backend utilise SQLite par defaut si `MYSQL_DATABASE` n est pas defini.

## Frontend React

Depuis `garageflow-web/`:

```bash
npm install
npm run dev
```

Le frontend est disponible par defaut sur `http://127.0.0.1:5173/` ou `http://localhost:5173/`.

## Variables d environnement

### Backend

Copier `garageflow-api/.env.example` puis definir si necessaire:

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CORS_ALLOWED_ORIGINS`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_HOST`
- `MYSQL_PORT`

En developpement, la configuration CORS accepte `localhost` et `127.0.0.1` sur ports locaux.

### Frontend

Definir si besoin:

- `VITE_API_URL`

Par defaut, le frontend pointe vers `http://127.0.0.1:8000`.

## Verification locale

### Backend

Depuis `garageflow-api/`:

```bash
python manage.py test users garages rendez_vous vehicules
```

### Frontend

Depuis `garageflow-web/`:

```bash
npm run build
```

## CI

Le workflow GitHub Actions verifie:

- installation du frontend
- build React
- installation des dependances backend
- migrations Django
- tests Django

Voir [ci.yml](/abs/path/c:/Users/modou/OneDrive/Documents/COURS/BacInformatiqueUQAR/Revision/MesProjets/GestionRendezVousAutomobile/.github/workflows/ci.yml).

## Workflow Git

Le projet suit un workflow simple:

- `master` : branche stable
- `dev` : integration
- `feature/...` : nouvelle fonctionnalite
- `fix/...` : correction

Regles:

- ne jamais coder directement sur `master`
- faire une branche par tache
- ecrire les commits en francais
- ouvrir une Pull Request avant merge

Le detail est documente dans [CONTRIBUTING.md](/abs/path/c:/Users/modou/OneDrive/Documents/COURS/BacInformatiqueUQAR/Revision/MesProjets/GestionRendezVousAutomobile/CONTRIBUTING.md).
