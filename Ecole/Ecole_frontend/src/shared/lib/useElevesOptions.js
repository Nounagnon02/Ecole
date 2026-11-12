import { useMemo } from 'react';
import { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';

/**
 * Élèves de l'école sous forme d'options de liste déroulante, triés par nom.
 * Le nom vit sur le compte de l'élève (`eleve.user`), pas sur `eleve`.
 */
export default function useElevesOptions(actif = true) {
  const requete = useApiQuery(['eleves'], '/eleves', { queryOptions: { enabled: actif } });
  return useMemo(() => (unwrapList(requete.data) ?? [])
    .map((e) => ({ value: e.id, label: `${e.user?.name ?? ''} ${e.user?.prenom ?? ''}${e.classe?.nom_classe ? ` · ${e.classe.nom_classe}` : ''}`.trim() }))
    .sort((a, b) => a.label.localeCompare(b.label)), [requete.data]);
}

export const nomEleve = (eleve) => `${eleve?.user?.name ?? ''} ${eleve?.user?.prenom ?? ''}`.trim();
