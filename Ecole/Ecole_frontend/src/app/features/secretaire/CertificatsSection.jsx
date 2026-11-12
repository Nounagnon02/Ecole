/**
 * Certificats de scolarité (lot 6.5) : établir, délivrer, imprimer.
 *
 * L'API savait établir et délivrer un certificat, sans aucun écran.
 */

import { useMemo, useState } from 'react';
import { FileCheck, Plus, Printer } from 'lucide-react';
import apiClient, { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import { formatDate } from '@/shared/lib/utils';
import useAuthStore from '@/shared/stores/auth-store';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Card from '@/shared/components/ui/Card';
import FormDialog from '@/shared/components/ui/FormDialog';
import { useTranslation } from '@/shared/i18n';

export const TYPES_CERTIFICAT = ['scolarite', 'frequentation', 'radiation'];
const nom = (c) => `${c.eleve?.user?.name ?? ''} ${c.eleve?.user?.prenom ?? ''}`.trim();

/** Le certificat imprimé : une page, texte fixe, sans décor. */
function CertificatImprime({ certificat, ecole }) {
  const { t } = useTranslation();
  const p = (cle, v) => t(`pages.secretaire.certificats.${cle}`, v);
  return (
    <article className="bulletin-imprimable space-y-6 text-[var(--text-primary)]">
      {ecole && <p className="text-sm font-semibold">{ecole}</p>}
      <h2 className="text-center text-xl font-bold uppercase">{p(`titres.${certificat.type_certificat}`)}</h2>
      <p className="text-sm">{p('numero')} : <span className="font-mono">{certificat.numero_certificat}</span></p>
      <p className="leading-relaxed">{p(`textes.${certificat.type_certificat}`, {
        nom: nom(certificat), matricule: certificat.eleve?.numero_matricule ?? '—', classe: certificat.eleve?.classe?.nom_classe ?? '—',
      })}</p>
      <p>{p('fait_le', { date: formatDate(certificat.date_emission) })}</p>
      <p className="pt-12 text-right">{p('signature')}</p>
    </article>
  );
}

export default function CertificatsSection() {
  const { t } = useTranslation();
  const p = (cle, v) => t(`pages.secretaire.certificats.${cle}`, v);
  const user = useAuthStore((s) => s.user);
  const ecole = user?.ecole?.nom || user?.ecole?.name || null;
  const [ouvert, setOuvert] = useState(false);
  const [aImprimer, setAImprimer] = useState(null);
  const requete = useApiQuery(['secretaire-certificats'], '/secretaire/certificats');
  const certificats = useMemo(() => unwrapList(requete.data) ?? [], [requete.data]);
  const requeteEleves = useApiQuery(['eleves'], '/eleves', { queryOptions: { enabled: ouvert } });
  const eleves = useMemo(() => (unwrapList(requeteEleves.data) ?? [])
    .map((e) => ({ value: e.id, label: `${e.user?.name ?? ''} ${e.user?.prenom ?? ''} · ${e.classe?.nom_classe ?? ''}`.trim() }))
    .sort((a, b) => a.label.localeCompare(b.label)), [requeteEleves.data]);

  const etablir = async (v) => {
    await apiClient.post('/secretaire/certificats', { ...v, eleve_id: Number(v.eleve_id) });
    requete.refetch();
  };
  const delivrer = async (c) => {
    await apiClient.put(`/secretaire/certificats/${c.id}/delivrer`);
    requete.refetch();
  };
  const imprimer = (c) => {
    setAImprimer(c);
    setTimeout(() => window.print(), 50);
  };

  return (
    <Card padding data-no-print>
      <FormDialog
        open={ouvert}
        title={p('etablir')}
        submitLabel={p('etablir')}
        initial={{ type_certificat: 'scolarite', date_emission: new Date().toISOString().slice(0, 10) }}
        fields={[
          { name: 'eleve_id', label: p('eleve'), type: 'select', options: eleves, required: true },
          { name: 'type_certificat', label: p('type'), type: 'select', options: TYPES_CERTIFICAT.map((v) => ({ value: v, label: p(`titres.${v}`) })), required: true },
          { name: 'date_emission', label: p('date'), type: 'date', required: true },
        ]}
        onSubmit={etablir}
        onClose={() => setOuvert(false)}
      />
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">{p('title')}</h2>
        <Button size="sm" icon={<Plus size={16} />} onClick={() => setOuvert(true)}>{p('etablir')}</Button>
      </div>
      {certificats.length === 0 ? (
        <p className="py-4 text-sm text-[var(--text-secondary)]">{p('aucun')}</p>
      ) : (
        <ul className="divide-y divide-[var(--border-light)]" data-testid="certificats">
          {certificats.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span>
                <span className="font-mono text-xs text-[var(--text-secondary)]">{c.numero_certificat}</span>
                <span className="ml-2 font-medium">{nom(c)}</span>
                <span className="ml-2 text-[var(--text-secondary)]">{p(`titres.${c.type_certificat}`)} · {formatDate(c.date_emission)}</span>
              </span>
              <span className="flex items-center gap-1">
                {c.delivre
                  ? <Badge variant="success">{p('delivre')}</Badge>
                  : <Button size="sm" variant="outline" icon={<FileCheck size={14} />} onClick={() => delivrer(c)}>{p('delivrer')}</Button>}
                <Button size="sm" variant="ghost" icon={<Printer size={14} />} onClick={() => imprimer(c)}>{p('imprimer')}</Button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="zone-impression" aria-hidden="true" data-testid="impression-certificat">
        {aImprimer && <CertificatImprime certificat={aImprimer} ecole={ecole} />}
      </div>
    </Card>
  );
}
