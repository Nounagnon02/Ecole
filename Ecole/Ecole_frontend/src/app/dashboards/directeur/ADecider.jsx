/**
 * « À décider » — ce qui demande une action de la direction (recommandation D8).
 *
 * Le tableau de bord montrait des chiffres ; ces trois listes disent quoi faire :
 * impayés échus par classe, notes non saisies depuis 30 jours, absences non
 * justifiées. « Relancer » prévient les parents (SMS) ou l'enseignant
 * (notification), une fois par jour au plus.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BellRing, Wallet, ClipboardList, UserX } from 'lucide-react';
import apiClient from '@/shared/lib/api-client';
import { formatCurrency } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useTranslation } from '@/shared/i18n';

function BoutonRelance({ type, id }) {
  const { t } = useTranslation();
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState('');

  const relancer = async () => {
    setEnvoi(true);
    setMessage('');
    try {
      const { data } = await apiClient.post('/directeur/decisions/relancer', { type, id });
      // Sans réseau, le client met l'écriture en file et répond `queued` :
      // rien n'est encore parti, il ne faut pas dire « envoyée ».
      setMessage(data?.queued ? t('dashboards.directeur.decisions.en_attente') : t('dashboards.directeur.decisions.envoyee'));
    } catch (err) {
      setMessage(err?.status === 409 ? t('dashboards.directeur.decisions.deja') : (err?.message || t('dashboards.directeur.decisions.echec')));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <Button size="sm" variant="secondary" icon={<BellRing size={14} aria-hidden="true" />} onClick={relancer} loading={envoi} disabled={envoi}>
        {t('dashboards.directeur.decisions.relancer')}
      </Button>
      <p role="status" className="max-w-40 text-end text-xs text-[var(--text-secondary)]">{message}</p>
    </div>
  );
}

function Liste({ titre, icone: Icone, lignes, rendu, loading }) {
  const { t } = useTranslation();
  return (
    <Card className="h-full">
      <Card.Header>
        <Card.Title as="h3" className="flex items-center gap-2"><Icone size={18} aria-hidden="true" />{titre}</Card.Title>
      </Card.Header>
      <Card.Body>
        {loading ? <Skeleton className="h-24 w-full" /> : lignes.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">{t('dashboards.directeur.decisions.rien')}</p>
        ) : (
          <ul className="divide-y divide-[var(--border-light)]">{lignes.slice(0, 6).map(rendu)}</ul>
        )}
      </Card.Body>
    </Card>
  );
}

export default function ADecider() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery({
    queryKey: ['directeur', 'decisions'],
    queryFn: async () => (await apiClient.get('/directeur/decisions')).data,
  });

  if (error) return null; // le reste du tableau de bord reste utilisable

  const pluriel = (n, un, plusieurs) => `${n} ${t(n > 1 ? plusieurs : un)}`;
  const ligne = (cle, principal, detail, type, id) => (
    <li key={cle} className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="font-medium text-[var(--text-primary)]">{principal}</p>
        <p className="text-sm text-[var(--text-secondary)]">{detail}</p>
      </div>
      <BoutonRelance type={type} id={id} />
    </li>
  );

  return (
    <section aria-labelledby="a-decider-titre" className="space-y-3">
      <h2 id="a-decider-titre" className="font-heading text-lg font-semibold text-[var(--text-primary)]">
        {t('dashboards.directeur.decisions.titre')}
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Liste titre={t('dashboards.directeur.decisions.impayes')} icone={Wallet} loading={isLoading} lignes={data?.impayes ?? []}
          rendu={(l) => ligne(`i-${l.classe_id}`, l.classe,
            `${pluriel(l.eleves, 'dashboards.directeur.decisions.eleve', 'dashboards.directeur.decisions.eleves')} · ${formatCurrency(l.montant_du)}`,
            'impayes', l.classe_id)} />
        <Liste titre={t('dashboards.directeur.decisions.notes')} icone={ClipboardList} loading={isLoading} lignes={data?.notes_manquantes ?? []}
          rendu={(l) => ligne(`n-${l.affectation_id}`, `${l.matiere} · ${l.classe}`,
            `${l.enseignant} · ${l.derniere_note ? t('dashboards.directeur.decisions.derniere', { date: l.derniere_note }) : t('dashboards.directeur.decisions.aucune')}`,
            'notes', l.affectation_id)} />
        <Liste titre={t('dashboards.directeur.decisions.absences')} icone={UserX} loading={isLoading} lignes={data?.absences ?? []}
          rendu={(l) => ligne(`a-${l.eleve_id}`, l.eleve,
            `${l.classe} · ${pluriel(l.absences, 'dashboards.directeur.decisions.absence', 'dashboards.directeur.decisions.absences_unite')}`,
            'absences', l.eleve_id)} />
      </div>
    </section>
  );
}
