/**
 * PretDialog — prêter un livre à un élève (lot 6.7).
 */

import { useMemo } from 'react';
import apiClient, { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import FormDialog from '@/shared/components/ui/FormDialog';
import useElevesOptions from '@/shared/lib/useElevesOptions';
import { useTranslation } from '@/shared/i18n';

const dans = (jours) => { const d = new Date(); d.setDate(d.getDate() + jours); return d.toISOString().slice(0, 10); };

export default function PretDialog({ open, livreId, onClose, onDone }) {
  const { t } = useTranslation();
  const p = (cle) => t(`pages.bibliothecaire.pret.${cle}`);
  const eleves = useElevesOptions(open);
  const requeteLivres = useApiQuery(['bibliothecaire-livres'], '/bibliothecaire/livres', { queryOptions: { enabled: open } });
  const livres = useMemo(() => (unwrapList(requeteLivres.data) ?? [])
    .filter((l) => (l.exemplaires_disponibles ?? (l.disponible ? 1 : 0)) > 0 || String(l.id) === String(livreId))
    .map((l) => ({ value: l.id, label: `${l.titre} · ${l.auteur}` })), [requeteLivres.data, livreId]);

  const preter = async (v) => {
    await apiClient.post('/bibliothecaire/emprunts', { ...v, livre_id: Number(v.livre_id), eleve_id: Number(v.eleve_id) });
    onDone?.();
  };

  return (
    <FormDialog
      open={open}
      title={p('titre')}
      submitLabel={p('preter')}
      initial={{ livre_id: livreId ? String(livreId) : '', date_emprunt: dans(0), date_retour_prevue: dans(14) }}
      fields={[
        { name: 'livre_id', label: p('livre'), type: 'select', options: livres, required: true },
        { name: 'eleve_id', label: p('eleve'), type: 'select', options: eleves, required: true },
        { name: 'date_emprunt', label: p('date_emprunt'), type: 'date', required: true },
        { name: 'date_retour_prevue', label: p('date_retour'), type: 'date', required: true },
      ]}
      onSubmit={preter}
      onClose={onClose}
    />
  );
}
