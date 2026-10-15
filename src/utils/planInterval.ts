/**
 * Période d'un forfait pour l'affichage. La base stocke « mois » (et parfois « month », « year », « an ») :
 * comparer seulement à « month » affichait « 2 990 €/an » pour un forfait mensuel.
 */
export function intervalLabel(interval?: string | null): 'mois' | 'an' {
  const value = (interval || '').trim().toLowerCase();
  return value === 'year' || value === 'an' || value === 'annual' || value === 'yearly' ? 'an' : 'mois';
}
