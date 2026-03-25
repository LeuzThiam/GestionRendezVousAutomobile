# Cahier des charges — Plateforme de rendez-vous pour prestataires

**Projet :** `GestionRendezVousAutomobile` (dépôt racine)  
**Version document :** mars 2025 (alignée sur le code dans `plateforme-api/` et `plateforme-web/`)  
**Objectif :** décrire le périmètre fonctionnel, technique et les contraintes du MVP tel qu’implémenté après la refonte « multi-établissements ».

---

## 1. Contexte et problématique

Les prestataires de services (ateliers, cabinets, services techniques, offres multi-services) ont besoin de :

- présenter une **fiche publique** et un **lien de réservation** ;
- recevoir et **traiter des demandes de rendez-vous** ;
- **organiser le planning** et **affecter en interne** des intervenants (ex. mécaniciens) ;
- permettre aux clients de **rechercher un établissement**, **suivre leurs demandes** et **échanger des propositions de créneaux**.

Le produit cible un **MVP SaaS** : authentification, rôles, isolation des données par organisation, cycle de vie des rendez-vous et reprogrammation avec historique.

---

## 2. Objectifs du produit

| Objectif | Description |
|----------|-------------|
| **O1** | Permettre à un **propriétaire** de créer et configurer son **établissement** (profil, type, services, disponibilités, équipe). |
| **O2** | Permettre aux **clients** de découvrir des établissements, consulter une fiche publique et **demander un rendez-vous**. |
| **O3** | Permettre à l’**établissement** de **confirmer, refuser, reprogrammer** et d’**affecter** un intervenant interne. |
| **O4** | Offrir aux **intervenants** (rôle mécanicien) un accès à leurs rendez-vous assignés. |
| **O5** | Assurer la **traçabilité** des propositions de reprogrammation et des décisions. |

---

## 3. Acteurs et rôles

| Rôle | Description |
|------|-------------|
| **Visiteur** | Non connecté ; accès à l’accueil, connexion, inscription, fiche publique et réservation par lien (`/pro/:slug/reservation`). |
| **Client** | Compte `client` ; recherche d’établissements, suivi des rendez-vous, demandes de modification ou d’annulation selon les règles métier. |
| **Propriétaire** | Compte `owner` ; gère **son** établissement et l’équipe (mécaniciens), planning, services, disponibilités. |
| **Mécanicien** | Compte `mecanicien` ; rattaché à un établissement ; consultation / traitement des rendez-vous qui lui sont affectés. |

---

## 4. Périmètre fonctionnel (MVP)

### 4.1 Côté client

- Inscription et connexion (JWT).
- Espace personnel (profil client).
- **Recherche d’établissements** (liste publique, filtres).
- **Fiche publique** et envoi d’une **demande de rendez-vous** (service, date souhaitée, description).
- Suivi des rendez-vous (statuts, historique, échanges de reprogrammation selon API).

*Note :* la gestion dédiée des véhicules n’est pas au cœur du périmètre « plateforme générique » ; l’app historique `vehicules` peut subsister côté backend pour compatibilité migrations sans exposer un parcours véhicule obligatoire au MVP décrit ici.

### 4.2 Côté établissement (espace pro — préfixe d’URL `/pro/`)

- Inscription **propriétaire** avec création de l’**organisation** (nom, slug, description, etc.).
- **Tableau de bord** synthétique (alertes, indicateurs, liens vers configuration).
- **Profil établissement** : coordonnées, type d’établissement, texte descriptif.
- **Catalogue de services** et **catégories** (prestations).
- **Disponibilités** générales et **fermetures exceptionnelles**.
- **Équipe** : mécaniciens et leurs disponibilités.
- **File des rendez-vous** : traitement, confirmation, refus, devis / durée / notes internes.
- **Planning** en vue horaire.
- **Lien public** de réservation par slug.

### 4.3 Types d’établissement

Le modèle **Organization** supporte au minimum :

- **Atelier et services techniques** (`automobile`) — catégories de prestations type entretien / diagnostic / etc.
- **Multi-services** (`multi_services`) — catégories adaptées (consultation, prestation, atelier, autre).

La valeur par défaut des nouveaux établissements est configurable ; les jeux de catégories par défaut sont décrits dans la logique métier (`prestations`).

### 4.4 Côté mécanicien

- Consultation du profil et des **rendez-vous** qui concernent l’utilisateur.
- Actions permises par les règles métier (cohérentes avec le rôle interne).

---

## 5. Exigences non fonctionnelles

| Domaine | Attendu MVP |
|---------|-------------|
| **Sécurité** | Authentification JWT ; routes protégées par rôle ; isolation des données par organisation pour les actions « owner » / « mécanicien ». |
| **API** | REST JSON, conventions Django REST Framework ; erreurs structurées. |
| **Frontend** | SPA React (Vite), responsive ; état de session via contexte d’authentification. |
| **Qualité** | Tests automatisés : suite Django (`python manage.py test`), tests Vitest sur le frontend ; CI GitHub Actions (build + tests). |
| **Documentation** | README opérationnel ; présent cahier des charges ; docs d’architecture modulaires dans `docs/`. |

---

## 6. Architecture technique (réalisation actuelle)

### 6.1 Dépôt

| Dossier | Rôle |
|---------|------|
| `plateforme-api/` | Backend **Django 5**, projet Python `garageflow_api` (nom de package inchangé pour compatibilité settings et migrations). |
| `plateforme-web/` | Frontend **React 18** + **Vite**, package npm `plateforme-web`. |

### 6.2 Backend — applications métier (principales)

- `comptes` : inscription, login, JWT, profil.
- `organizations` : modèle **Organization** (table SQL historique `garages_garage`), services, disponibilités, fermetures ; *label d’app Django `garages`* pour compatibilité avec les migrations existantes.
- `prestations` : catégories et services offerts.
- `planification` : règles et modèles liés au planning (selon découpage actuel).
- `personnel` : disponibilités mécaniciens, etc.
- `rendez_vous` : cycle de vie des RDV, reprogrammations.
- `reprogrammations` : historique des propositions.
- `users` : utilisateurs et profils métiers.
- `vehicules` : périmètre historique / migrations (non mis en avant fonctionnellement dans ce cahier).

### 6.3 Frontend — structure

- `src/app/` : routeur, providers.
- `src/features/` : domaines (authentification, client, organizations, personnel, planification, rendezvous, accueil).
- `src/shared/` : auth, routing, UI commune.
- `src/api/` : clients HTTP par domaine (ex. `fetchOrganization*Request` pour les ressources « mon établissement »).

### 6.4 API REST — points d’entrée principaux

- **Authentification :** préfixe ` /api/auth/`  
  - Ex. : `POST /api/auth/register/`, `POST /api/auth/register/owner/`, `POST /api/auth/register/client/`, `POST /api/auth/login/`, `POST /api/auth/refresh/`, `GET /api/auth/me/`, etc.

- **Organisations (établissement courant et public) :** préfixe ` /api/organizations/`  
  - Ex. : `GET/PATCH /api/organizations/me/`, `GET /api/organizations/public/`, `GET /api/organizations/public/<slug>/`, ressources imbriquées services, disponibilités, fermetures, catégories selon implémentation.

- **Utilisateurs / équipe :** préfixe ` /api/users/` (ex. mécaniciens côté propriétaire).

- **Rendez-vous :** préfixe ` /api/rendezvous/`.

Les champs exposés côté API utilisent la terminologie **organization** (ex. `organization`, `organization_id`, `organization_name`, `internal_note`) là où le modèle conserve encore des noms de champs historiques en base.

### 6.5 Interface web — routes notables

| Zone | Exemples |
|------|----------|
| Public | `/acceuil`, `/connexion`, `/inscription` |
| Client | `/profil/client`, `/profil/client/rendez-vous`, … |
| Pro (établissement) | `/pro/dashboard`, `/pro/profil`, `/pro/services`, `/pro/rendez-vous`, `/pro/planning`, `/pro/:slug/reservation` |
| Mécanicien | `/profil/mecanicien`, … |

---

## 7. Hors périmètre ou évolutions possibles

- Renommage complet du package Django `garageflow_api` et des noms de colonnes SQL (`garage` → `organization`) : à planifier avec migration de données.
- Facturation, paiement en ligne, notifications e-mail/SMS poussées.
- Application mobile native.
- Multi-établissements par même compte propriétaire (un compte = un établissement dans le MVP actuel sauf évolution ultérieure).

---

## 8. Critères de recette (MVP)

- [ ] Parcours propriétaire : création de compte, configuration minimale, visibilité fiche publique et lien de réservation.
- [ ] Parcours client : recherche, envoi d’une demande, suivi du statut.
- [ ] Parcours traitement : confirmation / refus / reprogrammation avec historique cohérent.
- [ ] Tests Django et build frontend passent en CI / localement.
- [ ] Cohérence terminologique **établissement / organisation** dans l’interface et la documentation utilisateur.

---

## 9. Références

- [README.md](../README.md) — installation et commandes.
- [CONTRIBUTING.md](../CONTRIBUTING.md) — flux Git.
- [Architecture frontend modulaire](frontend-modulaire.md)
- [Architecture backend modulaire](backend-modulaire.md)
- Workflow CI : `.github/workflows/ci.yml`
