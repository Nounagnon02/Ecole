/**
 * AuditLogPage — Journal d'audit consultable (direction)
 *
 * `AuditLog`/`Auditable` existaient et étaient alimentés depuis longtemps
 * (User, Notes), mais jamais consultables au-delà d'un widget de 10
 * dernières actions sur le dashboard admin. Cet écran expose la recherche
 * et le filtrage sur l'historique complet, borné à l'école du directeur
 * côté serveur (`AuditLog` porte `BelongsToEcole`).
 */

import { useState, Fragment } from 'react';
import { motion } from 'framer-motion';
import { History, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Select from '@/shared/components/ui/Select';
import Input from '@/shared/components/ui/Input';
import { useApiQuery } from '@/shared/lib/api-client';
import { formatDate } from '@/shared/lib/utils';
import { useTranslation } from '@/shared/i18n';

const EVENT_BADGE = {
  created: 'success',
  updated: 'warning',
  deleted: 'danger',
};

/** `App\Models\Notes` -> `Notes` : le nom court est plus lisible qu'un FQCN. */
function nomCourt(fqcn) {
  if (!fqcn) return '—';
  const parts = fqcn.split('\\');
  return parts[parts.length - 1];
}

function DiffRow({ label, values }) {
  if (!values || Object.keys(values).length === 0) return null;

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        {Object.entries(values).map(([champ, valeur]) => (
          <div key={champ} className="contents">
            <dt className="font-medium text-neutral-500 dark:text-neutral-400">{champ}</dt>
            <dd className="truncate text-neutral-700 dark:text-neutral-300">
              {typeof valeur === 'object' && valeur !== null ? JSON.stringify(valeur) : String(valeur ?? '—')}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function AuditLogPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [event, setEvent] = useState('');
  const [auditableType, setAuditableType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [openRow, setOpenRow] = useState(null);

  const params = { page, per_page: 25 };
  if (event) params.event = event;
  if (auditableType) params.auditable_type = auditableType;
  if (from) params.from = from;
  if (to) params.to = to;

  const requete = useApiQuery(
    ['audit-logs', page, event, auditableType, from, to],
    '/audit-logs',
    { config: { params } },
  );

  const payload = requete.data;
  const entries = payload?.data ?? [];
  const currentPage = payload?.current_page ?? 1;
  const lastPage = payload?.last_page ?? 1;
  const total = payload?.total ?? 0;

  const resetFilters = () => {
    setEvent('');
    setAuditableType('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const eventOptions = [
    { value: '', label: t('pages.audit.audit.all_events') },
    { value: 'created', label: t('pages.audit.audit.event_created') },
    { value: 'updated', label: t('pages.audit.audit.event_updated') },
    { value: 'deleted', label: t('pages.audit.audit.event_deleted') },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('pages.audit.audit.title')}</h1>
        <p className="text-sm text-neutral-500">{t('pages.audit.audit.subtitle')}</p>
      </div>

      <Card>
        <Card.Body className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Select
            aria-label={t('pages.audit.audit.filter_event')}
            label={t('pages.audit.audit.filter_event')}
            options={eventOptions}
            value={event}
            onChange={(e) => { setEvent(e.target.value); setPage(1); }}
          />
          <Input
            aria-label={t('pages.audit.audit.filter_type')}
            label={t('pages.audit.audit.filter_type')}
            placeholder={t('pages.audit.audit.filter_type_placeholder')}
            value={auditableType}
            onChange={(e) => { setAuditableType(e.target.value); setPage(1); }}
          />
          <Input
            type="date"
            aria-label={t('pages.audit.audit.from')}
            label={t('pages.audit.audit.from')}
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
          />
          <Input
            type="date"
            aria-label={t('pages.audit.audit.to')}
            label={t('pages.audit.audit.to')}
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
          />
          <div className="flex items-end">
            <Button variant="outline" size="sm" onClick={resetFilters} className="w-full">
              {t('pages.audit.audit.reset_filters')}
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card className="p-0">
        {requete.isPending ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : requete.isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
            <RefreshCw className="mb-2 h-6 w-6 text-red-400" />
            <p className="text-sm">{requete.error?.message ?? t('common.load_error')}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
            <History className="mb-2 h-8 w-8" />
            <p className="text-sm">{t('pages.audit.audit.empty')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-100 text-xs uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t('pages.audit.audit.column_date')}</th>
                    <th className="px-4 py-3 font-medium">{t('pages.audit.audit.column_user')}</th>
                    <th className="px-4 py-3 font-medium">{t('pages.audit.audit.column_event')}</th>
                    <th className="px-4 py-3 font-medium">{t('pages.audit.audit.column_item')}</th>
                    <th className="px-4 py-3 font-medium text-right">{t('pages.audit.audit.column_details')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {entries.map((entry) => {
                    const estOuvert = openRow === entry.id;
                    const auMoinsUnDetail = (entry.old_values && Object.keys(entry.old_values).length > 0)
                      || (entry.new_values && Object.keys(entry.new_values).length > 0);

                    return (
                      <Fragment key={entry.id}>
                        <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                          <td className="whitespace-nowrap px-4 py-3 text-neutral-500">{formatDate(entry.created_at, true)}</td>
                          <td className="px-4 py-3">
                            {entry.user ? `${entry.user.name} ${entry.user.prenom ?? ''}`.trim() : t('pages.audit.audit.unknown_user')}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={EVENT_BADGE[entry.event] ?? 'outline'} size="sm">
                              {t(`pages.audit.audit.event_${entry.event}`)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                            {nomCourt(entry.auditable_type)} #{entry.auditable_id}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {auMoinsUnDetail && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setOpenRow(estOuvert ? null : entry.id)}
                                icon={estOuvert ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              >
                                {estOuvert ? t('pages.audit.audit.hide_details') : t('pages.audit.audit.view_details')}
                              </Button>
                            )}
                          </td>
                        </tr>
                        {estOuvert && (
                          <tr>
                            <td colSpan={5} className="bg-neutral-50 px-4 py-4 dark:bg-neutral-900/40">
                              {auMoinsUnDetail ? (
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <DiffRow label={t('pages.audit.audit.before')} values={entry.old_values} />
                                  <DiffRow label={t('pages.audit.audit.after')} values={entry.new_values} />
                                </div>
                              ) : (
                                <p className="text-xs text-neutral-400">{t('pages.audit.audit.no_details')}</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 text-xs text-neutral-500 dark:border-neutral-800">
              <span>{t('pages.audit.audit.total_label', { n: total })}</span>
              <div className="flex items-center gap-3">
                <span>{t('pages.audit.audit.page_label', { current: currentPage, last: lastPage })}</span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={t('components.data_table.page_precedente')}
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    icon={<ChevronLeft className="h-3.5 w-3.5" />}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={t('components.data_table.page_suivante')}
                    disabled={currentPage >= lastPage}
                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                    icon={<ChevronRight className="h-3.5 w-3.5" />}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
}
