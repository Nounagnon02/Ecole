/**
 * ModulesPage — Marketplace de modules (Super Admin)
 *
 * Gestion des modules disponibles et activation par tenant.
 * Données dynamiques via API /api/v1/admin/modules
 */

import { useMemo } from 'react';
import { useApiQuery } from '@/shared/lib/api-client';
import { useTranslation } from '@/shared/i18n';
import { unwrapList } from '@/shared/lib/unwrap';
import { motion } from 'framer-motion';
import {
  Puzzle, ToggleLeft, ToggleRight,
  BookOpen, DollarSign, MessageSquare, Calendar, Zap,
  BarChart3, Globe, Smartphone, Shield, Loader2, AlertCircle
} from 'lucide-react';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';

const MODULE_ICONS = {
  core: Shield,
  academique: BookOpen,
  paiements: DollarSign,
  emploidutemps: Calendar,
  messagerie: MessageSquare,
  ia: Zap,
  api: Globe,
  mobile: Smartphone,
  bibliotheque: BookOpen,
  infirmerie: BarChart3
};

const MODULE_COLORS = {
  core: 'primary',
  academique: 'emerald',
  paiements: 'amber',
  emploidutemps: 'sky',
  messagerie: 'purple',
  ia: 'rose',
  api: 'cyan',
  mobile: 'neutral',
  bibliotheque: 'teal',
  infirmerie: 'red'
};

export default function ModulesPage() {
  const { t } = useTranslation();

  const requete = useApiQuery(['modules'], '/v1/admin/modules');

  // La page tenait un `useState` de données doublé d'un `useEffect` de premier
  // rendu — le motif répété sur trente-neuf pages, sans cache ni
  // déduplication (cf. audit P4.1). `unwrapList` traverse les trois formes
  // d'enveloppe que renvoient les contrôleurs.
  const modules = useMemo(() => unwrapList(requete.data) ?? [], [requete.data]);
  const loading = requete.isPending;
  const error = requete.isError ? (requete.error?.message ?? 'Erreur de chargement') : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
        <AlertCircle className="h-8 w-8 mb-2 text-red-400" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('pages.admin.modules.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('pages.admin.modules.subtitle')}</p>
        </div>
        <Button icon={<Puzzle className="h-4 w-4" />}>{t('pages.admin.modules.nouveau_module')}</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <Card>
              <div className="text-center py-8 text-neutral-500">
                <Puzzle className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">{t('pages.admin.modules.aucun_module_disponible')}</p>
              </div>
            </Card>
          </div>
        )}
        {modules.map((mod, i) => {
          const Icon = MODULE_ICONS[mod.slug] || Puzzle;
          const color = MODULE_COLORS[mod.slug] || 'neutral';
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card>
                <Card.Body className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-${color}-50 dark:bg-${color}-950/30`}>
                      <Icon className={`h-6 w-6 text-${color}-500`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-neutral-900 dark:text-white">{mod.name}</h3>
                        {mod.is_core && (
                          <Badge variant="primary" size="sm">{t('pages.admin.modules.core')}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mb-3">{mod.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-400">{mod.tenants_count ?? mod.tenants ?? 0} tenant(s)</span>
                        <button className={`inline-flex items-center gap-1 text-xs font-medium ${mod.is_active ? 'text-emerald-600' : 'text-neutral-400'}`}>
                          {mod.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                          {mod.is_active ? 'Activé' : 'Désactivé'}
                        </button>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
