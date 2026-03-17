# GestionRendezVousAutomobile

Projet de gestion de rendez-vous automobile compose de deux applications:

- `garageflow-api/` : API Django REST
- `garageflow-web/` : frontend React avec Vite

## Structure

### Backend

- authentification JWT
- gestion des utilisateurs
- gestion des vehicules
- gestion des rendez-vous
- gestion des factures

### Frontend

- connexion et inscription
- profils client et mecanicien
- gestion des vehicules
- prise et suivi des rendez-vous
- paiement et facturation

## Demarrage local

### Backend Django

Depuis `garageflow-api/`:

```bash
python -m venv env
env\Scripts\activate
pip install -r requirements-ci.txt
python manage.py migrate
python manage.py runserver
```

Le backend utilise SQLite par defaut si `MYSQL_DATABASE` n'est pas defini.

### Frontend React

Depuis `garageflow-web/`:

```bash
npm install
npm run dev
```

## Variables d'environnement

### Backend

Copier `garageflow-api/.env.example` et definir au besoin:

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CORS_ALLOWED_ORIGINS`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_HOST`
- `MYSQL_PORT`

### Frontend

Copier `garageflow-web/.env.example` et definir:

- `VITE_API_URL`

## CI

Une workflow GitHub Actions verifie:

- installation du frontend
- build React
- installation des dependances Django
- migrations Django
- tests Django

Voir `.github/workflows/ci.yml`.

## Workflow Git

Le projet suit un workflow par branches:

- `master` : stable
- `dev` : integration
- `feature/...` : fonctionnalites
- `fix/...` : corrections

Regles:

- ne pas coder directement sur `master`
- ouvrir une Pull Request pour chaque branche
- ecrire les commits en francais
- garder des commits courts et clairs

Le detail est documente dans `CONTRIBUTING.md`.
