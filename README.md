# GestionRendezVousAutomobile

Plateforme SaaS MVP de prise de rendez-vous en ligne pour **prestataires** (établissements : atelier / services techniques, multi-services, etc.).

Le détail du périmètre, des acteurs et de l’architecture est dans le [**cahier des charges**](docs/cahier-des-charges.md).

Le projet est composé de deux applications :

- `plateforme-api/` : backend Django REST
- `plateforme-web/` : frontend React avec Vite

## Vision du produit

Le produit repose sur une logique **multi-organisations** (établissements) :

- un propriétaire crée et administre **son établissement** (profil, type, services, horaires, équipe)
- les clients **recherchent un établissement**, consultent la fiche publique et envoient une demande de rendez-vous
- l’établissement traite la demande, organise le planning et affecte un **mécanicien** en interne

Du point de vue client, l’interlocuteur principal est **l’établissement**. Le mécanicien reste une ressource interne.

## Perimetre MVP

### Cote client

- creation de compte et connexion
- espace personnel
- recherche d’établissements (organisations publiques)
- consultation de la fiche publique
- envoi d une demande de rendez-vous
- suivi des rendez-vous et historique

### Cote etablissement (espace `/pro/`)

- creation de compte proprietaire avec creation de l’organisation
- tableau de bord
- gestion du profil établissement (type atelier / multi-services, etc.)
- gestion des services proposes
- gestion des disponibilites et fermetures
- gestion des mecaniciens
- gestion des disponibilites des mecaniciens
- traitement des demandes de rendez-vous
- reprogrammation avec historique des propositions
- affectation assistee des mecaniciens
- planning en vue horaire

### Cote mecanicien

- consultation de ses rendez-vous
- traitement de base des rendez-vous qui lui sont affectes

## Architecture

### Backend Django

Le backend est structure autour de domaines metier, dont notamment :

- `organizations` (code ; label Django `garages` pour l’historique des migrations)
- `comptes`, `prestations`, `planification`, `personnel`, `reprogrammations`
- `users`, `rendez_vous`, `vehicules` (legacy / migrations)

Fonctions principales :

- authentification JWT
- gestion des roles `owner`, `client`, `mecanicien`
- isolation des donnees par organisation (établissement)
- gestion des rendez-vous et de leur cycle de vie
- historique de reprogrammation
- gestion des disponibilites et du planning

### Frontend React

Le frontend repose sur :

- React 18
- React Router
- React Bootstrap
- Axios
- une couche `src/api/` par domaine
- un `AuthContext` pour la session utilisateur
- Vitest + Testing Library pour les tests frontend

## Fonctionnalites actuellement implementees

### Authentification

- inscription proprietaire
- inscription client
- connexion / deconnexion
- recuperation de l utilisateur courant

### Etablissement (API organizations)

- profil public
- description
- lien public de reservation (`/pro/:slug/reservation`)
- gestion des services
- gestion des disponibilites generales
- gestion des fermetures exceptionnelles
- gestion des mecaniciens
- gestion des disponibilites des mecaniciens
- dashboard et planning

### Rendez-vous

- creation par le client vers un etablissement (champ API `organization`)
- traitement par l’etablissement
- confirmation, refus, cloture
- reprogrammation avec historique des propositions
- note interne (`internal_note`) pour les reprogrammations
- affectation assistee du mecanicien

## Endpoints principaux

### Authentification

- `POST /api/auth/register/owner/`
- `POST /api/auth/register/client/`
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`

### Organisations (etablissement courant et annuaire public)

- `GET /api/organizations/me/`
- `PATCH /api/organizations/me/`
- `GET /api/organizations/public/`
- `GET /api/organizations/public/<slug>/`
- Ressources imbriquees sous `/api/organizations/me/` : services, disponibilites, fermetures, categories (selon routes exposees)

### Mecaniciens

- `GET /api/users/owner/mecaniciens/`
- `POST /api/users/owner/mecaniciens/`
- `PATCH /api/users/owner/mecaniciens/<id>/`
- `DELETE /api/users/owner/mecaniciens/<id>/`
- `GET /api/users/owner/mecaniciens/disponibilites/`

### Rendez-vous

- `GET /api/rendezvous/`
- `POST /api/rendezvous/`
- `PATCH /api/rendezvous/<id>/`

## Demarrage local

### 1. Backend

Depuis `plateforme-api/` :

```bash
python -m venv env
env\Scripts\activate
pip install -r requirements-ci.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Le backend utilise SQLite par defaut si aucune configuration MySQL n est fournie.

### 2. Frontend

Depuis `plateforme-web/` :

```bash
npm install
npm run dev
```

Le frontend demarre par defaut sur `http://127.0.0.1:5173/`.

## Variables d environnement

### Backend

Copier `plateforme-api/.env.example` puis definir si necessaire :

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

Copier `plateforme-web/.env.example` puis definir si besoin :

- `VITE_API_URL`

Par defaut, le frontend pointe vers `http://127.0.0.1:8000`.

## Verification locale

### Backend

Depuis `plateforme-api/` :

```bash
python manage.py test
```

### Frontend

Depuis `plateforme-web/` :

```bash
npm run test
npm run build
```

## CI

Le workflow GitHub Actions :

- installe le frontend
- execute les tests frontend
- lance le build frontend
- installe les dependances backend
- verifie les migrations manquantes
- applique les migrations
- execute les tests Django

Voir [.github/workflows/ci.yml](c:/Users/modou/OneDrive/Documents/COURS/BacInformatiqueUQAR/Revision/MesProjets/GestionRendezVousAutomobile/.github/workflows/ci.yml).

## Structure du depot

```text
GestionRendezVousAutomobile/
├── .github/
├── plateforme-api/
│   ├── garageflow_api/
│   ├── organizations/
│   ├── rendez_vous/
│   ├── users/
│   └── vehicules/
├── plateforme-web/
│   ├── src/
│   │   ├── Pages/
│   │   ├── api/
│   │   ├── shared/
│   │   └── utils/
│   └── package.json
├── CONTRIBUTING.md
└── README.md
```

## Workflow Git

- `master` : branche stable
- `dev` : integration
- `feature/...` : nouvelle fonctionnalite
- `fix/...` : correction

Regles retenues :

- ne pas coder directement sur `master`
- travailler par branche
- faire des commits simples en francais
- pousser les evolutions via GitHub

Le detail du flux de contribution est documente dans [CONTRIBUTING.md](c:/Users/modou/OneDrive/Documents/COURS/BacInformatiqueUQAR/Revision/MesProjets/GestionRendezVousAutomobile/CONTRIBUTING.md).
