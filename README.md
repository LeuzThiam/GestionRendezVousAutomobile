# GestionRendezVousAutomobile

Plateforme SaaS MVP de gestion de garages automobiles avec prise de rendez-vous en ligne.

Le projet est compose de deux applications :

- `garageflow-api/` : backend Django REST
- `garageflow-web/` : frontend React avec Vite

## Vision du produit

Le produit repose sur une logique multi-garages :

- un proprietaire cree et administre son garage
- il configure son profil, ses services, ses horaires et son equipe mecanique
- les clients recherchent un garage et envoient une demande de rendez-vous
- le garage traite la demande, organise le planning et affecte un mecanicien en interne

Du point de vue client, l interlocuteur principal est toujours le garage.  
Le mecanicien reste une ressource interne au garage.

## Perimetre MVP

### Cote client

- creation de compte et connexion
- espace personnel
- recherche de garages
- consultation de la fiche publique d un garage
- envoi d une demande de rendez-vous
- suivi des rendez-vous et historique
- gestion des vehicules

### Cote garage

- creation de compte proprietaire avec creation du garage
- tableau de bord garage
- gestion du profil garage
- gestion des services proposes
- gestion des disponibilites du garage
- gestion des mecaniciens
- gestion des disponibilites des mecaniciens
- traitement des demandes de rendez-vous
- reprogrammation avec historique des propositions
- affectation assistee des mecaniciens
- planning garage en vue horaire

### Cote mecanicien

- consultation de ses rendez-vous
- traitement de base des rendez-vous qui lui sont affectes

## Architecture

### Backend Django

Le backend est structure autour de domaines metier :

- `garages`
- `users`
- `vehicules`
- `rendez_vous`

Fonctions principales :

- authentification JWT
- gestion des roles `owner`, `client`, `mecanicien`
- isolation des donnees par garage
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

### Garage

- profil garage public
- description du garage
- lien public de reservation
- gestion des services
- gestion des disponibilites generales
- gestion des fermetures exceptionnelles
- gestion des mecaniciens
- gestion des disponibilites des mecaniciens
- dashboard garage
- planning garage

### Rendez-vous

- creation par le client a destination d un garage
- traitement par le garage
- confirmation, refus, cloture
- reprogrammation avec historique des propositions
- note interne garage pour les reprogrammations
- affectation assistee du mecanicien

## Endpoints principaux

### Authentification

- `POST /api/auth/register/owner/`
- `POST /api/auth/register/client/`
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`

### Garage

- `GET /api/garages/me/`
- `PATCH /api/garages/me/`
- `GET /api/garages/public/`
- `GET /api/garages/public/<slug>/`
- `GET /api/garages/me/services/`
- `GET /api/garages/me/disponibilites/`
- `GET /api/garages/me/fermetures/`

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

Depuis `garageflow-api/` :

```bash
python -m venv env
env\Scripts\activate
pip install -r requirements-ci.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Le backend utilise SQLite par defaut si aucune configuration MySQL n est fournie.

### 2. Frontend

Depuis `garageflow-web/` :

```bash
npm install
npm run dev
```

Le frontend demarre par defaut sur `http://127.0.0.1:5173/`.

## Variables d environnement

### Backend

Copier `garageflow-api/.env.example` puis definir si necessaire :

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

Copier `garageflow-web/.env.example` puis definir si besoin :

- `VITE_API_URL`

Par defaut, le frontend pointe vers `http://127.0.0.1:8000`.

## Verification locale

### Backend

Depuis `garageflow-api/` :

```bash
python manage.py test users garages rendez_vous vehicules
```

### Frontend

Depuis `garageflow-web/` :

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
├── garageflow-api/
│   ├── garageflow_api/
│   ├── garages/
│   ├── rendez_vous/
│   ├── users/
│   └── vehicules/
├── garageflow-web/
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
