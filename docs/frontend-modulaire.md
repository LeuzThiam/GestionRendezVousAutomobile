# Architecture frontend modulaire

Le frontend est maintenant organise autour de trois zones principales :

- `app`
- `shared`
- `features`

## Objectif

Sortir d'une structure centree uniquement sur `Pages/` afin de :

- separer le routage global de l'implementation des ecrans
- centraliser les providers et couches transverses
- preparer un decoupage par fonctionnalite metier
- rendre les futures refontes plus progressives

## Structure actuelle

### `src/app`

Contient :

- `AppProviders.jsx` pour les providers globaux
- `router.jsx` pour le routage principal

### `src/shared`

Contient les briques communes :

- `shared/auth` pour le contexte d'authentification
- `shared/api` comme point d'entree commun vers la couche API
- `shared/routing` pour `ProtectedRoute`
- `shared/layout` pour les elements de layout reutilisables

### `src/features`

Expose les ecrans par domaine metier :

- `authentification`
- `client`
- `garages`
- `personnel`
- `planification`
- `rendezvous`
- `acceuil`

La migration est maintenant mixte :

- certaines features reexportent encore les composants de `Pages/`
- les blocs les plus denses garage et client ont commence a etre deplaces dans `features/.../pages`
- `Pages/` reste une facade de compatibilite pour ne pas casser les imports existants

## Regle de migration

Quand une page doit etre refactorisee :

1. creer ou completer son dossier `features/...`
2. deplacer d'abord les hooks, utils et appels API communs
3. extraire ensuite les sous-composants visuels reutilisables vers `shared/ui`
4. laisser `Pages/` comme compatibilite temporaire jusqu'a la fin du decoupage

## Priorites suivantes

- terminer le deplacement des pages restantes dans leurs dossiers `features`
- creer `shared/ui` pour les composants repetes
- regrouper la logique rendez-vous dans `features/rendezvous`
- reduire progressivement la dependance directe a `Pages/`
