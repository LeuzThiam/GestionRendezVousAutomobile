/**
 * Alias entre champs API historiques et concepts génériques.
 * Utiliser ces helpers dans les nouveaux composants pour éviter
 * de disperser `mecanicien` / `garage` dans toute l'UI.
 */

/** Identifiant de l'établissement (Organization) sur une ressource API. */
export function getOrganizationId(resource) {
  return resource?.organization_id ?? resource?.organization ?? resource?.garage_id ?? resource?.garage;
}

/** Identifiant du membre d'équipe assigné (RDV, etc.). */
export function getAssigneeId(resource) {
  return resource?.employe ?? resource?.mecanicien ?? null;
}
