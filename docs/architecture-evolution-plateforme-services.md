# Évolution vers une plateforme de rendez-vous multi-secteurs

Document d’audit et de **transformation structurée**, basé sur le dépôt actuel (`plateforme-api`, `plateforme-web`).  
Complète `docs/backend-modulaire.md` et `docs/frontend-modulaire.md`.

---

## 1. Audit de l’existant

### 1.1 Architecture globale

| Couche | Technologie | Observation |
|--------|-------------|---------------|
| API | Django 5.x + DRF + JWT | Déjà découpée en apps métier (`comptes`, `organizations`, `personnel`, `planification`, `prestations`, `rendez_vous`, `reprogrammations`, `users`, `vehicules`) |
| Web | React (Vite) + React Router + Bootstrap | `app/` (router), `shared/`, `features/` + héritage `Pages/` |
| Auth | JWT simple, `Profile` lié à une org | Pas de multi-tenant SaaS avancé (un seul « monde » logique) |

**Forces** : séparation API par domaine, flux RDV riche (statuts, reprogrammations), frontend en route vers des modules par feature.

**Faiblesses** : vocabulaire et **squelette SQL** encore liés à `garages_*`, `mecanicien`, `DisponibiliteGarage` ; double exposition d’URLs (`/api/users/` vs `/api/personnel/` historique) ; pages React dupliquées (`Pages/*` vs `features/*/pages/*`).

### 1.2 Couplages forts

1. **FK `garage`** partout (`Profile`, `RendezVous`, `ServiceOffert`, planification) alors que le concept métier est déjà **Organization** côté code.
2. **`mecanicien`** sur `RendezVous` + `MecanicienDisponibilite` : nommage domaine automobile, alors que la logique est « membre d’équipe assignable ».
3. **Projet Django** `garageflow_api` et **label d’app** `garages` pour `organizations` (compat migrations) — à ne pas casser brutalement.
4. **Frontend** : `api/mecaniciens.js`, routes `/pro/mecaniciens`, état interne encore `mecanicien` dans les formulaires alors que l’API RDV expose `employe`.

### 1.3 Ce qui est déjà générique (réutilisable tel quel ou presque)

- **Organization** + `type_etablissement` (déjà `multi_services` vs `automobile`) — bon levier pour des **presets** (coiffure, esthétique, etc.) sans changer le modèle.
- **ServiceOffert** + catégories + durée + prix : modèle générique « offre catalogue ».
- **Disponibilite** (établissement + par employé) : pattern standard pour services.
- **Cycle de vie RDV** (pending → confirmed → done / rejected / reprogrammation) : transposable à tout secteur.
- **JWT + rôles** `owner` / `client` / `employe` : aligné avec une « équipe » générique.

### 1.4 Diagnostic synthétique

| Catégorie | Verdict |
|-----------|---------|
| **Conserver** | Découpage apps Django, logique métier dans `services.py` / serializers, structure `features/` côté React, modèle de statuts RDV |
| **Renommer** (progressif) | Champs DB `garage` → `organization` (FK), `mecanicien` → `assignee` ou `staff_member` (via migrations), tables `garages_*` → alias ou `db_table` stable + nouveaux noms |
| **Généraliser** | Libellés UI, types d’établissement, **règles d’assignation** (option « véhicule » = module métier), textes « atelier » / « garage » |
| **Supprimer ou isoler** | `vehicules` si vide / obsolète ; doublons de routes API si inutiles |
| **Réécrire** | Partie « annuaire mécaniciens » si elle n’a plus de sens hors auto ; éventuellement un **service** d’agrégation RDV côté backend pour éviter la logique dans les vues |

---

## 2. Cartographie ancien domaine → domaine cible

| Concept actuel (code / DB) | Cible métier | Notes |
|----------------------------|--------------|--------|
| `Organization` (table `garages_garage`) | **Business / Tenant léger** | Un jour : `tenant_id` si multi-tenant strict |
| `Profile.garage` | `organization` (FK) | Renommage Python + migration `RenameField` |
| `RendezVous.garage` | `organization` | Idem |
| `RendezVous.mecanicien` | `assignee` / `staff_user` | Garder FK `User` ; renommer champ + `related_name` |
| `ServiceOffert` | **Catalog service** | OK ; `garage` → `organization` |
| `CategoriePrestation` | **Service category** | OK |
| `DisponibiliteGarage` | **Location schedule** or **Business hours** | Renommage cosmétique + modèle |
| `MecanicienDisponibilite` | **Staff availability** | Renommer modèle / FK |
| Client (`User` + rôle `client`) | **Customer** | Garder identité Django ; option `CustomerProfile` plus tard |
| Véhicule | **optional** `CustomerAsset` ou module **auto-only** | Brancher par `type_etablissement` ou feature flag |

**Langage API** : exposer `organization`, `employee` / `assignee`, `booking` / `appointment` en JSON **sans casser** les clients : période de **alias** (`employe` + `mecanicien` en lecture seule).

---

## 3. Architecture cible (réaliste)

### 3.1 Backend Django (cible)

```
plateforme-api/
  garageflow_api/          # settings, urls (nom projet peut rester en Phase 1–2)
  comptes/                 # Identity (User, Profile, auth)
  organizations/           # Business (Organization, public profile) — label app 'garages' jusqu'à migration lourde
  catalog/                 # (futur) fusion logique de prestations + catégories OU garder prestations/
  scheduling/              # (futur) planification + fermetures (aujourd'hui planification/)
  workforce/               # (futur) renommer personnel/ — staff, disponibilités
  bookings/                # (futur) renommer rendez_vous/ — Appointment
  reprogrammations/        # peut rester satellite de bookings
  integrations/            # (SaaS) webhooks, facturation — vide au début
```

**Principe** : ne pas multiplier les apps sans besoin ; **renommer** `personnel` → `workforce` et `rendez_vous` → `bookings` **uniquement** quand les imports et migrations sont maîtrisés.

### 3.2 Frontend (cible)

```
src/
  app/                 # router, providers
  shared/              # auth, ui, api client, routing
  entities/            # (nouveau) types TS/JSDoc, mappers API → domain
  features/
    organizations/     # fiche établissement, dashboard pro
    workforce/         # ex-personnel, équipe
    scheduling/        # calendrier, dispos
    catalog/           # services
    bookings/          # ex-rendezvous
    customers/         # espace client
  pages/               # déprécier progressivement au profit de features/
```

**Couche `entities/`** : mapper une réponse API (`organization_id`, `employe`) vers un modèle **Booking** côté UI pour éviter les `mecanicien` dans les composants.

### 3.3 Principes de qualité

- **Use cases** dans `services.py` (déjà partiellement là) ; serializers = validation + I/O.
- **Pas de logique métier** dans les composants React au-delà de l’orchestration.
- **Tests** : prioriser `services` et transitions de statut RDV avant migration massive.

---

## 4. Plan de migration par phases

### Phase 1 — Stabilisation et nettoyage

| Objectif | Fichiers / zones | Risques | Livrables |
|----------|------------------|---------|-----------|
| Tests verts, une seule source de vérité API | `pytest`/`manage.py test`, `npm test` | Régression | CI verte |
| Documenter FKs et labels | `docs/*` | Dérive | Ce doc à jour |
| Supprimer code mort évident | `vehicules`, imports inutilisés | Casser des migrations | PR petites |

### Phase 2 — Renommage et abstraction métier

| Objectif | Fichiers | Risques | Livrables |
|----------|----------|---------|-----------|
| `garage` → `organization` sur modèles + migrations | `comptes`, `rendez_vous`, `prestations`, `planification` | Long, FK | Migrations Django `RenameField` |
| `mecanicien` → `assignee` (ou `staff_user`) sur RDV + dispos | `rendez_vous`, `personnel`, serializers | API clients | Alias JSON + doc OpenAPI |
| Frontend : `entities/booking.js`, mapper `employe` | `features/rendezvous` | Oubli de champ | Tests composants |

### Phase 3 — Réorganisation architecture

| Objectif | Fichiers | Risques | Livrables |
|----------|----------|---------|-----------|
| Fusionner `Pages/` dans `features/` | Tous les écrans | Imports cassés | Router unique |
| API : une route `/api/v2/` optionnelle | `urls.py` | Double maintenance | Versioning |

### Phase 4 — Migration fonctionnalités existantes

| Objectif | Dépendances | Livrables |
|----------|-------------|-----------|
| Parité complète après renommages | Phase 2 | Checklist QA |
| Données prod : script de vérif | Backup | Rapport |

### Phase 5 — Capacités SaaS (progressif)

| Objectif | Préparation dès maintenant |
|----------|----------------------------|
| Multi-entreprises | `Organization` déjà central ; ajouter `subscription` plus tard |
| Facturation | Interface `BillingProvider` vide |
| Isolation données | `QuerySet` filtrés par `organization` dans chaque `get_queryset` — à auditer |

### Phase 6 — Tests, qualité, documentation

- Couverture sur `rendez_vous.services`, `planification.services`.
- `docs/api.md` (contrats).
- Lint + format (backend `ruff`, frontend `eslint`).

---

## 5. Arborescence cible (exemple)

Voir `docs/frontend-modulaire.md` pour l’état actuel ; cible :

```
GestionRendezVousAutomobile/
  docs/
    architecture-evolution-plateforme-services.md   # ce fichier
    domain-glossary.md                              # (optionnel) termes FR/EN
  plateforme-api/
    comptes/
    organizations/
    prestations/        # ou catalog/
    planification/      # ou scheduling/
    personnel/          # ou workforce/
    rendez_vous/        # ou bookings/
    reprogrammations/
  plateforme-web/
    src/
      app/
      shared/
      entities/
      features/
```

---

## 6. Vision SaaS (réaliste)

| Horizonte | Contenu |
|-----------|---------|
| **Cœur** (maintenant) | Une org par utilisateur propriétaire, clients et employés rattachés à une org |
| **Court terme** | Présets `type_etablissement` étendus (coiffure, esthétique, …), textes UI 100 % neutres |
| **Moyen terme** | `Organization` + `Plan` (abonnement), quotas, désactivation |
| **Long terme** | Multi-tenant strict, sous-domaines, facturation |

**Préparer sans sur-construire** : champ `metadata` JSON sur `Organization` pour clés spécifiques (ex. « durée coupe par défaut ») sans nouvelles tables.

---

## 7. Fonctionnalités à préserver

- Gestion des rendez-vous (statuts, historique, reprogrammations).
- Disponibilités (établissement + employé).
- Services catalogue.
- Profils (propriétaire, client, employé).
- Lien public de réservation par `slug`.

**Réintégration** : inchangée fonctionnellement ; seule la **couche de nommage** et les **écrans** deviennent sectoriels via configuration (`type_etablissement` + thèmes).

---

## 8. Travail restant après transformation

- [ ] Migrations `RenameField` massives + tests.
- [ ] Unification `/api/users/` vs `/api/personnel/`.
- [ ] Suppression du doublon `Pages/` vs `features/`.
- [ ] i18n (fr/en) si ouverture internationale.
- [ ] Module optionnel « véhicule » branché sur type auto.
- [ ] Observabilité (logs structurés) et rate limiting API.

---

## 9. Honnêteté

- **Ne pas tout réécrire** : le modèle relationnel actuel est déjà proche d’un **SaaS de services** générique.
- **Le coût** est surtout **nommage + migrations + front mapper**, pas la réinvention du flux métier.
- **Renommer le projet** `garageflow_api` est cosmétique mais utile pour la clarté ; faible priorité vs données.

---

*Document généré pour cadrer la refactorisation ; à faire vivre à chaque phase.*
